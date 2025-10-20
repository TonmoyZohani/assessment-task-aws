import 'dotenv/config'; 
import { handler } from './src/index';

interface CreateUserEvent {
  info: { fieldName: 'createUser' };
  arguments: { input: { name: string; email: string; status?: string } };
}

interface GetUsersEvent {
  info: { fieldName: 'getUsers' };
  arguments: {
    search?: string;
    filter?: { status?: string };
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    nextToken?: string;
  };
}

async function test() {
  try {
    // Test createUser
    const createEvent: CreateUserEvent = {
      info: { fieldName: 'createUser' },
      arguments: { input: { name: 'Alice', email: 'alice@example.com' } },
    };
    const createResult = await handler(createEvent);
    console.log('Create Result:', createResult);

    // Test getUsers
    const getEvent: GetUsersEvent = {
      info: { fieldName: 'getUsers' },
      arguments: { search: 'Alice', filter: { status: 'ACTIVE' }, limit: 5 },
    };
    const getResult = await handler(getEvent);
    console.log('Get Result:', getResult);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
