import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';
import { AuthOutLinkLimitProps } from '@fastgpt/global/support/outLink/api.d';
import { NextAPI } from '@/service/middleware/entry';
import crypto from 'crypto';

// 验证 token 的函数
function verifyAuthToken(token: string, secretKey: string) {
  try {
    const [userId, timestamp, signature] = token.split('i');
    
    // 验证时间戳（例如：token 有效期为 24 小时）
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (currentTime - tokenTime > 24 * 60 * 60 * 1000) {
      throw new Error('Token has expired');
    }

    // 重新计算签名
    const data = `${userId}i${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');

    // 验证签名是否匹配
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    return userId;
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { outLinkUid: token, question, outLink } = req.body as AuthOutLinkLimitProps;

  try {
    // token验证
    if (!token) {
      throw new Error('Token is required');
    }

    // 从环境变量获取密钥
    const secretKey = process.env.SHARE_AUTH_SECRET_KEY || '';
    if (!secretKey) {
      throw new Error('Secret key is not configured');
    }

    // 验证 token 并获取用户 ID
    const userId = verifyAuthToken(token, secretKey);

    // 问题验证
    if (!question) {
      throw new Error('Question is required');
    }

    // QPM限制检查
    if (outLink?.limit?.QPM) {
      // 这里可以添加QPM限制的具体实现
      // 例如：检查Redis中的计数器等
    }

    // 验证成功，返回用户唯一凭证
    jsonRes(res, {
      data: {
        uid: userId
      }
    });
  } catch (error: any) {
    jsonRes(res, {
      code: 401,
      message: error.message || 'Authentication failed',
      data: null,
      error: OutLinkErrEnum.unAuthUser
    });
  }
}

export default NextAPI(handler); 