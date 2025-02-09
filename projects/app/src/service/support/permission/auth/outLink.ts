import { POST } from '@fastgpt/service/common/api/plusRequest';
import type {
  AuthOutLinkChatProps,
  AuthOutLinkLimitProps,
  AuthOutLinkInitProps,
  AuthOutLinkResponse
} from '@fastgpt/global/support/outLink/api.d';
import { ShareChatAuthProps } from '@fastgpt/global/support/permission/chat';
import { authOutLinkValid } from '@fastgpt/service/support/permission/publish/authLink';
import { getUserChatInfoAndAuthTeamPoints } from '@fastgpt/service/support/permission/auth/team';
import { AuthUserTypeEnum } from '@fastgpt/global/support/permission/constant';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';
import { OutLinkSchema } from '@fastgpt/global/support/outLink/type';
import crypto from 'crypto';

const SECRET_KEY = process.env.SHARE_AUTH_SECRET_KEY || 'FastGPT_SHARE_SECRET';

// 验证 token 格式：userId + "i" + timestamp + "i" + signature
function validateAuthToken(token: string): { isValid: boolean; userId: string } {
  try {
    if (!token) return { isValid: false, userId: '' };
    
    const [userId, timestamp, signature] = token.split('i');
    if (!userId || !timestamp || !signature) {
      return { isValid: false, userId: '' };
    }

    // 验证时间戳是否在有效期内（24小时）
    const timestampNum = parseInt(timestamp);
    if (isNaN(timestampNum)) {
      return { isValid: false, userId: '' };
    }
    
    const now = Date.now();
    if (now - timestampNum > 24 * 60 * 60 * 1000) {
      return { isValid: false, userId: '' };
    }

    // 验证签名
    const data = `${userId}i${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('hex');

    // 使用 Uint8Array 进行安全比较
    const signatureBuffer = new Uint8Array(Buffer.from(signature, 'hex'));
    const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, 'hex'));

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { isValid: false, userId: '' };
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    return {
      isValid,
      userId: isValid ? userId : ''
    };
  } catch (error) {
    return { isValid: false, userId: '' };
  }
}

export function authOutLinkInit(data: AuthOutLinkInitProps): Promise<AuthOutLinkResponse> {
  const { outLinkUid } = data;
  const { isValid, userId } = validateAuthToken(outLinkUid);
  
  if (!isValid) {
    return Promise.reject(OutLinkErrEnum.linkUnInvalid);
  }

  return Promise.resolve({ uid: userId });
}

export function authOutLinkChatLimit(data: AuthOutLinkLimitProps): Promise<AuthOutLinkResponse> {
  if (!global.feConfigs?.isPlus) return Promise.resolve({ uid: data.outLinkUid });
  return POST<AuthOutLinkResponse>('/support/outLink/authChatStart', data);
}

export const authOutLink = async ({
  shareId,
  outLinkUid
}: ShareChatAuthProps): Promise<{
  uid: string;
  appId: string;
  outLinkConfig: OutLinkSchema;
}> => {
  if (!outLinkUid) {
    return Promise.reject(OutLinkErrEnum.linkUnInvalid);
  }

  const { isValid, userId } = validateAuthToken(outLinkUid);
  if (!isValid) {
    return Promise.reject(OutLinkErrEnum.linkUnInvalid);
  }

  const result = await authOutLinkValid({ shareId });

  return {
    ...result,
    uid: userId
  };
};

export async function authOutLinkChatStart({
  shareId,
  ip,
  outLinkUid,
  question
}: AuthOutLinkChatProps & {
  shareId: string;
}) {
  // get outLink and app
  const { outLinkConfig, appId } = await authOutLinkValid({ shareId });

  // check ai points and chat limit
  const [{ timezone, externalProvider }, { uid }] = await Promise.all([
    getUserChatInfoAndAuthTeamPoints(outLinkConfig.tmbId),
    authOutLinkChatLimit({ outLink: outLinkConfig, ip, outLinkUid, question })
  ]);

  return {
    sourceName: outLinkConfig.name,
    teamId: outLinkConfig.teamId,
    tmbId: outLinkConfig.tmbId,
    authType: AuthUserTypeEnum.token,
    responseDetail: outLinkConfig.responseDetail,
    showNodeStatus: outLinkConfig.showNodeStatus,
    timezone,
    externalProvider,
    appId,
    uid
  };
}
