import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';
import { AuthOutLinkInitProps } from '@fastgpt/global/support/outLink/api.d';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { outLinkUid: token } = req.body as AuthOutLinkInitProps;

  try {
    // 这里可以添加自定义的token验证逻辑
    if (!token) {
      throw new Error('Token is required');
    }

    // 验证成功，返回用户唯一凭证
    jsonRes(res, {
      data: {
        uid: token // 这里可以根据需要生成或映射用户唯一凭证
      }
    });
  } catch (error: any) {
    jsonRes(res, {
      code: 401,
      message: error.message || 'Authentication failed',
      data: null
    });
  }
}

export default NextAPI(handler); 