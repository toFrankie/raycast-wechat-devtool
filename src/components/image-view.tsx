import { Detail } from "@raycast/api";
import { EXTENSION_TITLE } from "../constants";

interface ImageViewProps {
  image: string;
  navigationTitle: string;
  width?: number;
  height?: number;
}

export default function ImageView({ image, navigationTitle = EXTENSION_TITLE, width, height }: ImageViewProps) {
  const params: string[] = [];

  if (width) {
    params.push(`raycast-width=${width}`);
  }
  if (height) {
    params.push(`raycast-height=${height}`);
  }

  const query = params.join("&");
  const markdown = `![](${image}${query ? `?${query}` : ""})`;

  return <Detail markdown={markdown} navigationTitle={navigationTitle} />;
}
