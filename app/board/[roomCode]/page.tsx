import BoardView from './BoardView';

export default async function Page({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return <BoardView roomCode={roomCode} />;
}
