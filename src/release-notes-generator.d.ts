declare module "@semantic-release/release-notes-generator" {
  export function generateNotes(
    pluginConfig: { config?: string },
    context: {
      cwd: string
      commits: { hash: string; message: string }[]
      lastRelease: { gitTag: string; gitHead: string; version: string }
      nextRelease: { gitTag: string; gitHead: string; version: string }
      options: { repositoryUrl: string }
    },
  ): Promise<string>
}
