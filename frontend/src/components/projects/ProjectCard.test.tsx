import { describe, it, expect } from "vitest";
import { render, screen } from "../../test/utils";
import { ProjectCard } from "./ProjectCard";
import type { ProjectListItem } from "../../types";

const mockProject: ProjectListItem = {
  id: "test-id",
  name: "Test Project",
  created_at: "2024-01-15T00:00:00Z",
  source_video: null,
  extracted_audio: null,
  segment_count: 0,
};

describe("ProjectCard", () => {
  it("renders project name", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("shows 'No video' badge when no source video", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("No video")).toBeInTheDocument();
  });

  it("shows 'Video uploaded' badge when source video exists", () => {
    const projectWithVideo = { ...mockProject, source_video: "video.mp4" };
    render(<ProjectCard project={projectWithVideo} />);
    expect(screen.getByText("Video uploaded")).toBeInTheDocument();
  });

  it("shows segment count", () => {
    const projectWithSegments = { ...mockProject, segment_count: 5 };
    render(<ProjectCard project={projectWithSegments} />);
    expect(screen.getByText("5 segments")).toBeInTheDocument();
  });

  it("links to project editor page", () => {
    render(<ProjectCard project={mockProject} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/test-id");
  });
});
