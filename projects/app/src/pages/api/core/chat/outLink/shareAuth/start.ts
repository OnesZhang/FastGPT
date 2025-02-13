import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { OutLinkErrEnum } from '@fastgpt/global/common/error/code/outLink';
import { AuthOutLinkLimitProps } from '@fastgpt/global/support/outLink/api.d';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { outLinkUid: token, question, outLink } = req.body as AuthOutLinkLimitProps;

  try {
    // token验证
    if (!token) {
      throw new Error('Token is required');
    }

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