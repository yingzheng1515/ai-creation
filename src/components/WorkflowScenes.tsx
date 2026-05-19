import type { HistoryEntry, ImageResult, ScriptResult, ScriptScene, VideoResult } from "@/types/generation";

type WorkflowScenesProps = {
  entries: HistoryEntry[];
};

function latestResult<T extends ScriptResult | ImageResult | VideoResult>(
  entries: HistoryEntry[],
  type: T["type"],
): T | null {
  const entry = entries.find((item) => item.type === type);
  return entry?.result.type === type ? (entry.result as T) : null;
}

function resultForPrompt<T extends ImageResult | VideoResult>(
  entries: HistoryEntry[],
  type: T["type"],
  prompt: string,
): T | null {
  const entry = entries.find((item) => item.type === type && item.result.type === type && item.result.prompt === prompt);
  return entry?.result.type === type ? (entry.result as T) : null;
}

function scenesFromScript(script: ScriptResult | null): ScriptScene[] {
  if (!script) {
    return [];
  }

  if (script.scenes && script.scenes.length > 0) {
    return script.scenes;
  }

  return [
    {
      id: "scene-1",
      title: "自动生成",
      shot: script.content,
      narration: "",
      imagePrompt: script.content,
      videoPrompt: script.content,
      durationSeconds: 4,
    },
  ];
}

export function WorkflowScenes({ entries }: WorkflowScenesProps) {
  const script = latestResult<ScriptResult>(entries, "script");
  const scenes = scenesFromScript(script);
  const completedImages = scenes.filter((scene) => resultForPrompt<ImageResult>(entries, "image", scene.imagePrompt)).length;
  const completedVideos = scenes.filter((scene) => resultForPrompt<VideoResult>(entries, "video", scene.videoPrompt)).length;

  return (
    <>
      <section className="flow-steps" aria-label="自动化流程">
        <div className={script ? "step done" : "step current"}>
          <span>壹</span>
          <strong>剧本分镜</strong>
        </div>
        <div className={completedImages === scenes.length && scenes.length > 0 ? "step done" : script ? "step current" : "step"}>
          <span>贰</span>
          <strong>画面生成</strong>
        </div>
        <div className={completedVideos === scenes.length && scenes.length > 0 ? "step done" : completedImages > 0 ? "step current" : "step"}>
          <span>叁</span>
          <strong>视频合成</strong>
        </div>
      </section>

      <section className="scene-stack" aria-label="场景流">
        {script ? (
          scenes.map((scene, index) => {
            const image = resultForPrompt<ImageResult>(entries, "image", scene.imagePrompt);
            const video = resultForPrompt<VideoResult>(entries, "video", scene.videoPrompt);

            return (
              <article key={scene.id} className={image && !video ? "scene-card active-scene" : "scene-card"}>
                <header className="scene-head">
                  <strong>镜 {String(index + 1).padStart(2, "0")}</strong>
                  <span>{scene.title} / {scene.durationSeconds} 秒</span>
                </header>
                <div className="scene-grid">
                  <div className="scene-column script-column">
                    <div className="column-label success">Script</div>
                    <h3 className="scene-title">{scene.title}</h3>
                    <p>{scene.shot}</p>
                    {scene.narration ? <div className="scene-narration">旁白：{scene.narration}</div> : null}
                  </div>

                  <div className="scene-column image-column">
                    <div className={image ? "column-label success" : "column-label"}>{image ? "Image · 完成" : "Image"}</div>
                    {image ? (
                      <img className="workflow-media" src={image.url} alt={image.prompt} />
                    ) : (
                      <div className="loading-art idle">
                        <strong>等待画面生成</strong>
                      </div>
                    )}
                  </div>

                  <div className={video ? "scene-column video-column" : "scene-column video-column muted"}>
                    <div className={video ? "column-label success" : "column-label"}>{video ? "Video · 完成" : "Video"}</div>
                    {video ? (
                      <>
                        <video className="workflow-media" src={video.url} controls data-testid="workflow-video">
                          <track kind="captions" />
                        </video>
                        <div className="workflow-status">视频已生成</div>
                      </>
                    ) : (
                      <div className="dashed-action locked">
                        <span>等待视频合成</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="scene-card muted-scene">
            <header className="scene-head">
              <strong>镜 01</strong>
              <span>等待输入 / 起始镜头</span>
            </header>
            <div className="scene-grid">
              <div className="scene-column script-column">
                <div className="column-label">Script</div>
                <div className="waiting-copy">等待脚本生成</div>
              </div>
              <div className="scene-column image-column">
                <div className="loading-art idle">
                  <strong>等待画面生成</strong>
                </div>
              </div>
              <div className="scene-column video-column muted">
                <div className="dashed-action locked">
                  <span>等待视频合成</span>
                </div>
              </div>
            </div>
          </article>
        )}

        <button className="add-scene" type="button">撰写新镜</button>
      </section>
    </>
  );
}
