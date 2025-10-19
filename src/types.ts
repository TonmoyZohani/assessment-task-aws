export interface User {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  status?: string;
}

export interface GetUsersArgs {
  search?: string;
  filter?: {
    status?: string;
  };
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  nextToken?: string;
}

export interface AppSyncEvent {
  info: {
    fieldName: string;
  };
  arguments: {
    input?: CreateUserInput;
    search?: string;
    filter?: {
      status?: string;
    };
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    nextToken?: string;
  };
}

export interface UserConnection {
  items: User[];
  nextToken: string | null;
}