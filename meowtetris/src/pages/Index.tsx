const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-foreground">🐱 MeowTetris</h1>
        <p className="text-xl text-muted-foreground">귀여운 고양이 블럭 테트리스 게임</p>
        <a
          href="/meowtetris.html"
          className="inline-block px-8 py-4 text-xl font-bold rounded-2xl border-2 border-dashed border-primary bg-secondary text-primary hover:bg-accent transition-all"
        >
          게임 시작 🎮
        </a>
      </div>
    </div>
  );
};

export default Index;
