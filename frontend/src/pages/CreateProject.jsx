import { useCreateProject } from "../hooks/apis/mutations/useCreateProject";
import { useNavigate } from "react-router-dom";
import { useGetAllProjects } from "../hooks/apis/queries/useGetAllProjects";

export const CreateProject = () => {
  const { createProjectMutation, isPending } = useCreateProject();
  const { isError, isLoading, data, error } = useGetAllProjects();
  const navigate = useNavigate();

  async function handleCreateProject() {
    try {
      const response = await createProjectMutation();
      navigate(`/project/${response.data}`);
    } catch (error) {
      console.error("Error creating project", error);
    }
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-red-400">
          <span className="text-2xl">⚠️</span> Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1b2e] to-[#0f0f23] text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg glow-blue">
              ⚛️
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">ReactForge</h1>
              <p className="text-gray-400 text-sm">Cloud IDE for React Development</p>
            </div>
          </div>
        </header>

        {/* Create Project Card */}
        <div className="max-w-2xl mx-auto mb-16 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass rounded-3xl p-8 card-hover transition-all duration-300">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-4xl pulse-glow">
                🚀
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Create New Playground</h2>
                <p className="text-gray-400">Spin up a fresh React + Vite environment in seconds</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#1a1b26]/50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-sm text-gray-400">Vite Powered</div>
              </div>
              <div className="bg-[#1a1b26]/50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🔥</div>
                <div className="text-sm text-gray-400">Hot Reload</div>
              </div>
              <div className="bg-[#1a1b26]/50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm text-gray-400">Docker Isolated</div>
              </div>
            </div>

            <button
              onClick={handleCreateProject}
              disabled={isPending}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${isPending
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90 btn-glow cursor-pointer'
                }`}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Playground...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  Create Playground
                </>
              )}
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="text-2xl">📁</span>
              Your Projects
              {data && data.length > 0 && (
                <span className="bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full">
                  {data.length}
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading projects...
              </div>
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
              {data.map((project, index) => (
                <div
                  key={project}
                  onClick={() => navigate(`/project/${project}`)}
                  className="glass rounded-2xl p-6 cursor-pointer card-hover transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      ⚛️
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">Project</h3>
                      <p className="text-xs text-gray-500 truncate font-mono">{project.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Ready
                    </div>
                    <button className="text-blue-400 text-sm font-medium group-hover:text-blue-300 flex items-center gap-1">
                      Open
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-gray-400">Create your first playground to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProject;