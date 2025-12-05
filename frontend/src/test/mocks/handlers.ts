import { http, HttpResponse } from "msw";
import type { Project, ProjectListItem } from "../../types";

const API_URL = "http://localhost:8000/api";

// Mock data
export const mockProjects: ProjectListItem[] = [
  {
    id: "project-1",
    name: "Test Project 1",
    created_at: "2024-01-01T00:00:00Z",
    source_video: null,
    extracted_audio: null,
    segment_count: 0,
  },
  {
    id: "project-2",
    name: "Test Project 2",
    created_at: "2024-01-02T00:00:00Z",
    source_video: "video.mp4",
    extracted_audio: "audio.wav",
    segment_count: 3,
  },
];

export const mockProject: Project = {
  id: "project-1",
  name: "Test Project 1",
  created_at: "2024-01-01T00:00:00Z",
  source_video: null,
  extracted_audio: null,
};

export const handlers = [
  // List projects
  http.get(`${API_URL}/projects`, () => {
    return HttpResponse.json(mockProjects);
  }),

  // Get project by ID
  http.get(`${API_URL}/projects/:id`, ({ params }) => {
    const { id } = params;
    if (id === "project-1") {
      return HttpResponse.json(mockProject);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Create project
  http.post(`${API_URL}/projects`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const newProject: Project = {
      id: "new-project-id",
      name: body.name,
      created_at: new Date().toISOString(),
      source_video: null,
      extracted_audio: null,
    };
    return HttpResponse.json(newProject, { status: 201 });
  }),

  // Delete project
  http.delete(`${API_URL}/projects/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
