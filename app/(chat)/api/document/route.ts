import { BlockKind } from '@/components/block';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Document API: No authorization header');
    return new Response('Unauthorized', { status: 401 });
  }

  // Extract the wallet address
  const walletAddress = authHeader.split(' ')[1];
  if (!walletAddress) {
    console.log('❌ Document API: No wallet address found');
    return new Response('Unauthorized', { status: 401 });
  }

  // Use wallet address as userId
  const userId = walletAddress;

  const documents = await getDocumentsById({ id });
  const [document] = documents;

  if (!document) {
    return new Response('Not Found', { status: 404 });
  }

  if (document.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Document API: No authorization header');
    return new Response('Unauthorized', { status: 401 });
  }

  // Extract the wallet address
  const walletAddress = authHeader.split(' ')[1];
  if (!walletAddress) {
    console.log('❌ Document API: No wallet address found');
    return new Response('Unauthorized', { status: 401 });
  }

  // Use wallet address as userId
  const userId = walletAddress;

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: BlockKind } = await request.json();

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId,
  });

  return Response.json(document, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Document API: No authorization header');
    return new Response('Unauthorized', { status: 401 });
  }

  // Extract the wallet address
  const walletAddress = authHeader.split(' ')[1];
  if (!walletAddress) {
    console.log('❌ Document API: No wallet address found');
    return new Response('Unauthorized', { status: 401 });
  }

  // Use wallet address as userId
  const userId = walletAddress;

  const documents = await getDocumentsById({ id });
  const [document] = documents;

  if (document.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return new Response('Deleted', { status: 200 });
}
