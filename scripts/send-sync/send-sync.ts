import { $ } from 'bun';

type SendSyncDependencies = {
  commit: string;
  readBranchHead: () => Promise<string>;
  writeSyncEvent: (commit: string) => Promise<void>;
};

// A run that ends after a newer commit's run would move the zgeoff/tools pin back to its older
// commit, so only the branch head's run sends.
export async function runSendSync(dependencies: SendSyncDependencies): Promise<string> {
  const head = await dependencies.readBranchHead();

  if (!shouldSendSync(dependencies.commit, head)) {
    return `skipped ${dependencies.commit}: the branch head is now ${head}, whose run sends it`;
  }

  await dependencies.writeSyncEvent(dependencies.commit);

  return `sent ${dependencies.commit} to zgeoff/tools`;
}

function shouldSendSync(commit: string, head: string): boolean {
  return commit === head;
}

if (import.meta.main) {
  const repo = readEnvValue('GITHUB_REPOSITORY');
  const branch = readEnvValue('GITHUB_REF_NAME');
  const toolsToken = readEnvValue('TOOLS_TOKEN');

  const message = await runSendSync({
    commit: readEnvValue('GITHUB_SHA'),
    readBranchHead: async () =>
      (await $`gh api repos/${repo}/commits/${branch} --jq .sha`.text()).trim(),
    writeSyncEvent: async (commit) => {
      await $`gh api --silent repos/zgeoff/tools/dispatches -f event_type=zgeoff-skills-sync -f client_payload[sha]=${commit}`.env(
        { ...process.env, GH_TOKEN: toolsToken },
      );
    },
  });

  console.log(message);
}

function readEnvValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`send-sync: set ${name}`);
  }

  return value;
}
