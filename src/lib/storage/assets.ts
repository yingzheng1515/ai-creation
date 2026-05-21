import { getOssConfig, uploadAssetToOss } from "./oss";
import type { OssConfig } from "./oss";
import type { ImageResult, VideoResult } from "@/types/generation";

type PersistOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  randomId?: () => string;
};

type PersistableResult = ImageResult | VideoResult;

function withTestOverrides(config: OssConfig, options: PersistOptions): OssConfig {
  return {
    ...config,
    fetchImpl: options.fetchImpl,
    now: options.now,
    randomId: options.randomId,
  };
}

export async function persistGeneratedAsset<T extends PersistableResult>(
  result: T,
  options: PersistOptions = {},
): Promise<T> {
  const config = getOssConfig(options.env);

  if (!config) {
    return result;
  }

  const stored = await uploadAssetToOss(
    {
      kind: result.type,
      prompt: result.prompt,
      sourceUrl: result.url,
    },
    withTestOverrides(config, options),
  );

  return {
    ...result,
    url: stored.url,
  };
}
