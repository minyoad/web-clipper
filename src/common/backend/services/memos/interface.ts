import { CreateDocumentRequest } from './../interface';
import locales from '@/common/locales';

export const VisibilityType = [
  { label: () => locales.format({ id: 'backend.services.memos.headerForm.VisibilityType.private', defaultMessage: 'private' }), value: 'PRIVATE' },
  { label: () => locales.format({ id: 'backend.services.memos.headerForm.VisibilityType.protected', defaultMessage: 'protected' }), value: 'PROTECTED' },
  { label: () => locales.format({ id: 'backend.services.memos.headerForm.VisibilityType.public', defaultMessage: 'public' }), value: 'PUBLIC' },
] as const;

export type VisibilityType = typeof VisibilityType[number];

export interface MemosBackendServiceConfig {
  accessToken: string;
  origin: string;
}

/**
 * 不同版本的 Memos 返回的用户字段存在差异：
 * - 旧版使用 nickname
 * - 0.25+ 改为 displayname / displayName
 */
export interface MemosUser {
  username?: string;
  name?: string;
  displayName?: string;
  displayname?: string;
  nickname?: string;
  avatarUrl?: string;
  description?: string;
}

export interface MemosUserResponse {
  user?: MemosUser;
  authenticated?: boolean;
  lastAccessedAt?: string;
}

export interface MemosUserInfo {
  name: string;
  avatar: string;
  homePage: string;
  description: string;
}

export interface MemoCreateDocumentRequest extends CreateDocumentRequest {
	visibility?: VisibilityType;
	tags?: string;
}
