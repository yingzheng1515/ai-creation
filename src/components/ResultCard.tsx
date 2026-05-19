import type { GenerationResult } from "@/types/generation";

type ResultCardProps = {
  result: GenerationResult | null;
};

export function ResultCard({ result }: ResultCardProps) {
  if (!result) {
    return <div className="result-empty">生成结果会显示在这里。</div>;
  }

  if (result.type === "script") {
    return <pre className="script-result">{result.content}</pre>;
  }

  if (result.type === "image") {
    return <img className="media-preview" src={result.url} alt={result.prompt} />;
  }

  return (
    <video className="media-preview" src={result.url} controls>
      <track kind="captions" />
    </video>
  );
}
