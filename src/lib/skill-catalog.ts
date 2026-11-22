/** Local suggestions: no network requests during filtering. */
export type CatalogSkill = {
  name: string
  icon?: string
  category: 'Developer' | 'Creative' | 'Professional'
}
const dev = (name: string, icon?: string): CatalogSkill => ({ name, icon, category: 'Developer' })
const art = (name: string, icon?: string): CatalogSkill => ({ name, icon, category: 'Creative' })
const general = (name: string): CatalogSkill => ({ name, category: 'Professional' })

export const SKILLS: readonly CatalogSkill[] = [
  dev('Vite', 'vite/vite-original.svg'),
  dev('Vim', 'vim/vim-original.svg'),
  dev('Vitest', 'vitest/vitest-original.svg'),
  dev('Visual Studio Code', 'vscode/vscode-original.svg'),
  dev('TypeScript', 'typescript/typescript-original.svg'),
  dev('JavaScript', 'javascript/javascript-original.svg'),
  dev('Python', 'python/python-original.svg'),
  dev('React', 'react/react-original.svg'),
  dev('HTML', 'html5/html5-original.svg'),
  dev('CSS', 'css3/css3-original.svg'),
  dev('Node.js', 'nodejs/nodejs-original.svg'),
  dev('Git', 'git/git-original.svg'),
  dev('GitHub', 'github/github-original.svg'),
  dev('Linux', 'linux/linux-original.svg'),
  dev('Docker', 'docker/docker-original.svg'),
  dev('Kubernetes', 'kubernetes/kubernetes-original.svg'),
  dev('Cloudflare', 'cloudflare/cloudflare-original.svg'),
  dev('Next.js', 'nextjs/nextjs-original.svg'),
  dev('PostgreSQL', 'postgresql/postgresql-original.svg'),
  dev('Go', 'go/go-original.svg'),
  dev('Rust', 'rust/rust-original.svg'),
  dev('Java', 'java/java-original.svg'),
  dev('C', 'c/c-original.svg'),
  dev('C++', 'cplusplus/cplusplus-original.svg'),
  dev('C#', 'csharp/csharp-original.svg'),
  dev('PHP', 'php/php-original.svg'),
  dev('Ruby', 'ruby/ruby-original.svg'),
  dev('Swift', 'swift/swift-original.svg'),
  dev('Kotlin', 'kotlin/kotlin-original.svg'),
  dev('Dart', 'dart/dart-original.svg'),
  dev('Bash', 'bash/bash-original.svg'),
  dev('PowerShell', 'powershell/powershell-original.svg'),
  dev('SQL', 'azuresqldatabase/azuresqldatabase-original.svg'),
  dev('Vue', 'vuejs/vuejs-original.svg'),
  dev('Svelte', 'svelte/svelte-original.svg'),
  dev('Angular', 'angular/angular-original.svg'),
  dev('Astro', 'astro/astro-original.svg'),
  dev('Tailwind CSS', 'tailwindcss/tailwindcss-original.svg'),
  dev('GitLab', 'gitlab/gitlab-original.svg'),
  dev('Terraform', 'terraform/terraform-original.svg'),
  dev('Redis', 'redis/redis-original.svg'),
  dev('MongoDB', 'mongodb/mongodb-original.svg'),
  dev('MySQL', 'mysql/mysql-original.svg'),
  dev('SQLite', 'sqlite/sqlite-original.svg'),
  dev('AWS', 'amazonwebservices/amazonwebservices-original-wordmark.svg'),
  dev('Azure', 'azure/azure-original.svg'),
  dev('Google Cloud', 'googlecloud/googlecloud-original.svg'),
  dev('Supabase', 'supabase/supabase-original.svg'),
  dev('Vercel', 'vercel/vercel-original.svg'),
  dev('Nginx', 'nginx/nginx-original.svg'),
  dev('Express', 'express/express-original.svg'),
  dev('FastAPI', 'fastapi/fastapi-original.svg'),
  dev('Flask', 'flask/flask-original.svg'),
  dev('Django', 'django/django-plain.svg'),
  dev('PyTorch', 'pytorch/pytorch-original.svg'),
  dev('Pandas', 'pandas/pandas-original.svg'),
  dev('NumPy', 'numpy/numpy-original.svg'),
  dev('Linux Arch', 'archlinux/archlinux-original.svg'),
  art('Figma', 'figma/figma-original.svg'),
  art('Blender', 'blender/blender-original.svg'),
  art('Photoshop', 'photoshop/photoshop-original.svg'),
  art('Video Editing'), art('Motion Design'), art('Illustration'),
  art('Photography'), art('Copywriting'), art('Graphic Design'),
  art('UI Design'), art('UX Research'), art('Creative Writing'),
  general('Communication'), general('Project Management'),
  general('Public Speaking'), general('Research'), general('Data Analysis'),
  general('Customer Service'), general('Teaching'), general('Leadership'),
  general('Excel'),
]

export function suggestSkills(input: string, selected: readonly string[], limit = 7): CatalogSkill[] {
  const query = input.trim().toLowerCase()
  if (!query || query.includes(',')) return []
  const used = new Set(selected.map(s => s.toLowerCase()))
  return SKILLS.filter(s => s.name.toLowerCase().includes(query) && !used.has(s.name.toLowerCase()))
    .sort((a, b) =>
      Number(b.name.toLowerCase().startsWith(query)) - Number(a.name.toLowerCase().startsWith(query)) ||
      a.name.length - b.name.length || a.name.localeCompare(b.name),
    )
    .slice(0, limit)
}

/** Match known technology names without treating arbitrary user text as an image URL. */
export function findCatalogSkill(name: string): CatalogSkill | undefined {
  const normalized = name.trim().toLowerCase()
  return SKILLS.find(skill => skill.name.toLowerCase() === normalized)
}
