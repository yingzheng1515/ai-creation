import type { HistoryEntry, ImageResult, ScriptResult, VideoResult } from "@/types/generation";

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

export function WorkflowScenes({ entries }: WorkflowScenesProps) {
  const script = latestResult<ScriptResult>(entries, "script");
  const image = latestResult<ImageResult>(entries, "image");
  const video = latestResult<VideoResult>(entries, "video");

  return (
    <>
      <section className="flow-steps" aria-label="自动化流程">
        <div className={script ? "step done" : "step current"}>
          <span>壹</span>
          <strong>剧本分镜</strong>
        </div>
        <div className={image ? "step done" : script ? "step current" : "step"}>
          <span>贰</span>
          <strong>画面生成</strong>
        </div>
        <div className={video ? "step done" : image ? "step current" : "step"}>
          <span>叁</span>
          <strong>视频合成</strong>
        </div>
      </section>

      <section className="scene-stack" aria-label="场景流">
        <article className={image && !video ? "scene-card active-scene" : "scene-card"}>
          <header className="scene-head">
            <strong>镜 01</strong>
            <span>自动生成 / 最新结果</span>
          </header>
          <div className="scene-grid">
            <div className="scene-column script-column">
              <div className={script ? "column-label success" : "column-label"}>Script</div>
              {script ? <p>{script.content}</p> : <div className="waiting-copy">等待脚本生成</div>}
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

        <article className="scene-card muted-scene">
          <header className="scene-head">
            <strong>镜 02</strong>
            <span>待扩展 / 下一镜</span>
          </header>
          <div className="scene-grid">
            <div className="scene-column script-column">
              <div className="column-label">Script</div>
              <p>后续可以把一个完整脚本拆成多镜头，再逐镜生成图片和视频。</p>
            </div>
            <div className="scene-column image-column">
              <div className="loading-art">
                <span className="scan-line" />
                <strong>丹青泼墨中</strong>
                <small>示例状态</small>
              </div>
            </div>
            <div className="scene-column video-column muted">
              <div className="dashed-action locked">
                <span>等待画卷完成</span>
              </div>
            </div>
          </div>
        </article>

        <button className="add-scene" type="button">撰写新镜</button>
      </section>
    </>
  );
}
