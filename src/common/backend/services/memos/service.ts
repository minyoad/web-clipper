import { DocumentService } from '../../index';
import { extend, RequestMethod } from 'umi-request';
import { CompleteStatus } from '../interface';
import { Repository } from '@/common/backend/services/interface';
import {
  MemosBackendServiceConfig,
  MemoCreateDocumentRequest,
  MemosUserInfo,
} from './interface';

interface MemosRequestError extends Error {
  status?: number;
}

/**
 * 仅适配最新版 Memos（v0.26+ / 26.x）的 API：
 * - 基础路径为 /api
 * - 获取当前用户：GET  /api/auth/me
 * - 创建笔记：    POST /api/memos
 */
export default class MemosDocumentService implements DocumentService {
  private request: RequestMethod;
  private token: string;
  private origin: string;
  private UserInfo: MemosUserInfo | null;

  constructor({ accessToken, origin }: MemosBackendServiceConfig) {
    const realHost = (origin || 'https://demo.usememos.com').replace(/\/+$/, '');
    this.request = extend({
      prefix: `${realHost}/api/`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    this.request.interceptors.response.use(
      async response => {
        if (!response.ok) {
          let code = '';
          let message = '';
          try {
            const json = await response.clone().json();
            code = json?.code ?? json?.id ?? '';
            message = json?.message ?? '';
          } catch {
            // 响应体不是 JSON 时忽略
          }
          const error = new Error(
            `(${response.status})${code ? ` code=${code}:` : ''} ${message || '未知错误'}`
          ) as MemosRequestError;
          error.status = response.status;
          throw error;
        }
        return response;
      },
      error => {
        if (error.response) {
          const status = error.response.status;
          return error.response.json().then(
            (json: any) => {
              const e = new Error(
                `(${status})${json?.code ? ` code=${json.code}:` : ''} ${
                  json?.message || error.message || '未知错误'
                }`
              ) as MemosRequestError;
              e.status = status;
              throw e;
            },
            () => {
              const e = new Error(
                `(${status}) ${error.message || '未知错误'}`
              ) as MemosRequestError;
              e.status = status;
              throw e;
            }
          );
        }
        throw new Error(`(500): ${error.message || '网络错误'}`);
      }
    );
    this.token = accessToken;
    this.origin = realHost;
    this.UserInfo = null;
  }

  getId = () => {
    return '0';
  };

  getUserInfo = async (): Promise<MemosUserInfo> => {
    const response = await this.request.get<{ user?: any }>('auth/me');
    const user = response?.user || {};

    const username: string =
      user.username || (typeof user.name === 'string' ? user.name.replace(/^users\//, '') : '');

    if (!username) {
      throw new Error('获取用户信息失败');
    }

    const displayName: string = user.displayName || user.displayname || user.nickname || username;

    let avatar: string;
    if (user.avatarUrl) {
      avatar = /^https?:\/\//.test(user.avatarUrl)
        ? user.avatarUrl
        : `${this.origin}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`;
    } else {
      avatar = 'https://demo.usememos.com/full-logo.webp';
    }

    const userInfo: MemosUserInfo = {
      name: username,
      avatar,
      homePage: this.origin,
      description: user.description || displayName,
    };

    this.UserInfo = userInfo;
    return userInfo;
  };

  private addTag = (tags: string, content: string): string => {
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    const formattedTags = tagArray.map(tag => `#${tag}`).join(' ');
    return `${content}\n${formattedTags}`;
  };

  /** 从返回的 Memo 中取出 uid（资源名格式为 memos/{uid}） */
  private pickMemoUid = (memo: any): string => {
    if (!memo) {
      return '';
    }
    if (typeof memo.name === 'string' && memo.name) {
      return memo.name.replace(/^memos\//, '');
    }
    return memo.uid || memo.id || '';
  };

  createDocument = async (info: MemoCreateDocumentRequest): Promise<CompleteStatus> => {
    if (!this.UserInfo) {
      this.UserInfo = await this.getUserInfo();
    }

    let content = info.content;
    if (info.tags) {
      content = this.addTag(info.tags, content);
    }

    const memo = await this.request.post<any>('memos', {
      data: {
        content,
        visibility: info.visibility || 'PRIVATE',
        state: 'NORMAL',
      },
    });

    const uid = this.pickMemoUid(memo);
    const href = uid ? `${this.origin}/m/${uid}` : `${this.origin}/u/${this.UserInfo.name}`;

    return { href };
  };

  getRepositories = async (): Promise<Repository[]> => {
    return [
      {
        id: 'memos_default',
        name: '默认分区 Default Repo',
        groupId: 'memos',
        groupName: '默认分组 Defualt Group',
      },
    ];
  };
}
