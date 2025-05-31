export function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const body = document.body;

  // Comprobar preferencia del sistema o guardada
  const savedTheme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // Aplicar tema inicial
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Alternar tema
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    const isDark = body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    // Guardar preferencia
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}