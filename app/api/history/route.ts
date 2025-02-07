import { getChatsByUserId, getUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ History API: No authorization header');
    return Response.json('Unauthorized!', { status: 401 });
  }

  // Extract the wallet address
  const walletAddress = authHeader.split(' ')[1];
  if (!walletAddress) {
    console.log('❌ History API: No wallet address found');
    return Response.json('Unauthorized!', { status: 401 });
  }

  // Get user by wallet address
  const [user] = await getUser(walletAddress);
  if (!user) {
    console.log('❌ History API: User not found');
    return Response.json('User not found', { status: 404 });
  }

  const chats = await getChatsByUserId({ id: user.id });
  return Response.json(chats);
}
