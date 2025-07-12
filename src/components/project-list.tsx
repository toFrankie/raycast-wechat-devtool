import { homedir } from "os";
import { useState, useEffect } from "react";
import { showFailureToast } from "@raycast/utils";
import { List, ActionPanel, Action, Icon, useNavigation, showToast, Toast } from "@raycast/api";

import { getExtensionConfig, updateProjectLastUsed } from "../utils/config";
import { Project, ExtensionConfig } from "../types";
import Configure from "../configure";
import ReadmeView from "../readme-view";

interface ProjectListProps {
  onProjectAction: (project: Project, config: ExtensionConfig) => void;
  requiredFields?: string[];
  actionPanelExtra?: React.ReactNode;
  actionTitle: string;
  onConfigChange?: () => void;
}

export default function ProjectList({
  onProjectAction,
  requiredFields = ["name", "path"],
  actionPanelExtra,
  actionTitle,
  onConfigChange,
}: ProjectListProps) {
  const { push } = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [config, setConfig] = useState<ExtensionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function formatPath(projectPath: string): string {
    const homeDir = homedir();
    if (projectPath.startsWith(homeDir)) {
      return projectPath.replace(homeDir, "~");
    }
    return projectPath;
  }

  useEffect(() => {
    loadProjects();
  }, [refreshTrigger]);

  async function loadProjects() {
    try {
      setIsLoading(true);
      const currentConfig = await getExtensionConfig();
      setConfig(currentConfig);
      setProjects(currentConfig.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      await showFailureToast(error, { title: "Failed to Load", message: "Could not load project configuration" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      await loadProjects();
      await showToast({
        style: Toast.Style.Success,
        title: "Refreshed",
        message: "Project list has been updated",
      });
    } catch (error) {
      await showFailureToast(error, { title: "Failed to Refresh" });
    }
  }

  function handleConfigChange() {
    // Trigger a refresh by updating the refreshTrigger
    setRefreshTrigger((prev) => prev + 1);
    onConfigChange?.();
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.path.toLowerCase().includes(searchText.toLowerCase()),
  );

  if (projects.length === 0) {
    return (
      <List searchBarPlaceholder="Search projects...">
        <List.EmptyView
          icon={{ source: "icon.svg" }}
          title="No Projects"
          description="No projects have been configured"
          actions={
            <ActionPanel>
              <Action
                title="Go to Configuration"
                icon={Icon.Gear}
                onAction={() => push(<Configure onConfigChange={handleConfigChange} />)}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
              <Action
                title="Refresh Project List"
                icon={Icon.ArrowClockwise}
                onAction={handleRefresh}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              <Action title="About This Extension" icon={Icon.Book} onAction={() => push(<ReadmeView />)} />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const missingFieldProject = projects.find((project) =>
    requiredFields.some((field) => {
      if (field === "name") return !project.name;
      if (field === "path") return !project.path;
      return false;
    }),
  );

  if (missingFieldProject) {
    return (
      <List searchBarPlaceholder="Search projects...">
        <List.EmptyView
          icon={{ source: "icon.svg" }}
          title="Incomplete Configuration"
          description={`Missing required fields: ${requiredFields.join(", ")}`}
          actions={
            <ActionPanel>
              <Action
                title="Go to Configuration"
                icon={Icon.Gear}
                onAction={() => push(<Configure onConfigChange={handleConfigChange} />)}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
              <Action
                title="Refresh Project List"
                icon={Icon.ArrowClockwise}
                onAction={handleRefresh}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              <Action title="About This Extension" icon={Icon.Book} onAction={() => push(<ReadmeView />)} />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const sortedProjects = filteredProjects
    .slice()
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .map((project) => ({
      ...project,
      displayPath: formatPath(project.path),
    }));

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects..." onSearchTextChange={setSearchText}>
      {sortedProjects.map((project) => (
        <List.Item
          key={project.id}
          icon={Icon.Folder}
          title={project.name}
          subtitle={project.displayPath}
          accessories={[{ text: new Date(project.lastUsedAt).toLocaleDateString() }]}
          actions={
            <ActionPanel>
              <Action
                title={actionTitle}
                icon={Icon.Terminal}
                onAction={() => {
                  if (config) {
                    updateProjectLastUsed(project.id);
                    onProjectAction(project, config);
                  }
                }}
                shortcut={{ modifiers: [], key: "return" }}
              />
              <Action
                title="Go to Configuration"
                icon={Icon.Gear}
                onAction={() => push(<Configure onConfigChange={handleConfigChange} />)}
                shortcut={{ modifiers: ["cmd"], key: "return" }}
              />
              <Action.CopyToClipboard
                title="Copy Project Path"
                content={project.path}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="Refresh Project List"
                icon={Icon.ArrowClockwise}
                onAction={handleRefresh}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
              <Action title="About This Extension" icon={Icon.Book} onAction={() => push(<ReadmeView />)} />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
