import { showFailureToast } from "@raycast/utils";
import { useNavigation, showToast, Toast } from "@raycast/api";

import ProjectList from "./components/project-list";
import ImageView from "./components/image-view";
import { previewProject } from "./utils/command";
import { ExtensionConfig, Project } from "./types";

export default function PreviewProject() {
  const { push } = useNavigation();

  async function handlePreviewProject(project: Project, config: ExtensionConfig) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Generating QR Code...",
    });

    try {
      const qrcodePath = await previewProject(config.cliPath, project.path, project.id);
      push(<ImageView image={qrcodePath} navigationTitle={project.name} width={300} />);
      toast.hide();
    } catch (error) {
      showFailureToast(error, { title: "Failed to Preview Project" });
    }
  }

  return <ProjectList onProjectAction={handlePreviewProject} actionTitle="Preview Project" />;
}
