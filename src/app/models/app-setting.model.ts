export type SettingValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

export interface AppSetting {
  id: string;
  key: string;
  value: any; // typed by backend: string | number | boolean | object | array
  valueType: SettingValueType;
  category: string | null;
  description: string | null;
  isPublic: boolean;
}

export interface AppSettingRequest {
  key: string;
  value: any;
  valueType: SettingValueType;
  category: string | null;
  description: string | null;
  isPublic: boolean;
}
