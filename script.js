// === Virtual Filesystem ===
const filesystem = {
  'C:\\': {
    type: 'folder',
    children: {
      'Blog': {
        type: 'folder',
        children: {
          'blog1.txt': {
            type: 'file',
            content: 'Welcome to my first blog post!\n\nThis is where I share my thoughts\non building things with code.\n\nStay tuned for more updates.'
          },
          'blog2.txt': {
            type: 'file',
            content: 'Blog Post #2\n\nToday I learned about CSS 3D\ntransforms. You can build entire\nshapes out of flat divs.\n\nPretty cool stuff.'
          },
          'post1.txt': {
            type: 'file',
            content: 'Post 1 - Hello World\n\nEvery journey starts with a\nsingle step. This is mine.\n\nThanks for reading.'
          }
        }
      },
      'Links': {
        type: 'folder',
        children: {}
      }
    }
  }
};

// === State ===
let currentPath = 'C:\\';

// === DOM refs ===
const startup = document.getElementById('startup');
const desktop = document.getElementById('desktop');
const fileExplorer = document.getElementById('file-explorer');
const explorerButton = document.getElementById('explorer-button');
const explorerContent = document.getElementById('explorer-content');
const explorerStatus = document.getElementById('explorer-status');
const backBtn = document.getElementById('back-btn');
const addressBar = document.getElementById('address-bar');
const tooltipEl = document.getElementById('tooltip');

// Notepad window tracking
let notepadWindows = [];
let notepadOffset = 0;

// IE refs
const ieWindow = document.getElementById('ie-window');
const ieDesktopIcon = document.getElementById('ie-desktop-icon');
const ieFrame = document.getElementById('ie-frame');
const ieAddress = document.getElementById('ie-address');
const ieBack = document.getElementById('ie-back');
const ieForward = document.getElementById('ie-forward');
const ieRefresh = document.getElementById('ie-refresh');
const ieHome = document.getElementById('ie-home');
const ieGo = document.getElementById('ie-go');
const ieTitle = document.getElementById('ie-title');
const ieStatus = document.getElementById('ie-status');

const ieTaskbarButton = document.getElementById('ie-taskbar-button');

const IE_HOME = 'https://wiby.me/';

// === Startup → Desktop Transition ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !startup.classList.contains('fade-out')) {
    startup.classList.add('fade-out');
    startup.addEventListener('transitionend', () => {
      startup.style.display = 'none';
      desktop.classList.add('active');
    }, { once: true });
  }
});

// === Filesystem Navigation ===
function getNode(path) {
  if (path === 'C:\\') return filesystem['C:\\'];
  const parts = path.replace('C:\\', '').split('\\').filter(Boolean);
  let node = filesystem['C:\\'];
  for (const part of parts) {
    if (!node || !node.children) return null;
    node = node.children[part];
    if (!node) return null;
  }
  return node;
}

function renderFolder(path) {
  currentPath = path;
  addressBar.textContent = path;
  backBtn.disabled = (path === 'C:\\');

  const node = getNode(path);
  if (!node || node.type !== 'folder') return;

  const entries = Object.entries(node.children);
  explorerStatus.textContent = entries.length + ' object(s)';

  let html = '<div class="folder-grid">';

  for (const [name, entry] of entries) {
    if (entry.type === 'folder') {
      html += `
        <div class="folder-item" data-name="${name}" data-type="folder">
          <div class="folder-icon">
            <div class="folder-tab"></div>
            <div class="folder-body"></div>
          </div>
          <span class="folder-label">${name}</span>
        </div>`;
    } else {
      html += `
        <div class="file-item" data-name="${name}" data-type="file">
          <div class="file-icon"></div>
          <span class="file-label">${name}</span>
        </div>`;
    }
  }

  if (entries.length === 0) {
    html += '<span style="font-size:9px;color:#808080;padding:10px;">This folder is empty.</span>';
  }

  html += '</div>';
  explorerContent.innerHTML = html;

  explorerContent.querySelectorAll('.folder-item').forEach(el => {
    el.addEventListener('dblclick', () => {
      const name = el.dataset.name;
      const newPath = currentPath === 'C:\\' ? 'C:\\' + name : currentPath + '\\' + name;
      renderFolder(newPath);
    });
  });

  explorerContent.querySelectorAll('.file-item').forEach(el => {
    el.addEventListener('dblclick', () => {
      const name = el.dataset.name;
      const fullPath = currentPath === 'C:\\' ? 'C:\\' + name : currentPath + '\\' + name;
      openFile(name, fullPath);
    });
  });
}

function openFile(name, path) {
  const node = getNode(path);
  if (!node || node.type !== 'file') return;
  createNotepadWindow(name, node.content);
}

function createNotepadWindow(name, content) {
  const win = document.createElement('div');
  win.className = 'window notepad-window resizable';

  const offsetVal = notepadOffset % 5;
  win.style.top = (100 + offsetVal * 30) + 'px';
  win.style.left = (200 + offsetVal * 30) + 'px';
  notepadOffset++;

  win.innerHTML = `
    <div class="title-bar">
      <span class="title-bar-text">${name} - Notepad</span>
      <div class="title-bar-controls">
        <button class="title-btn minimize-btn" data-tooltip="Minimize">_</button>
        <button class="title-btn maximize-btn" data-tooltip="Maximize">&#9633;</button>
        <button class="title-btn close-btn" data-tooltip="Close">&times;</button>
      </div>
    </div>
    <div class="menu-bar">
      <span>File</span>
      <span>Edit</span>
      <span>Format</span>
      <span>Help</span>
    </div>
    <div class="window-content text-viewer-content"></div>
    <div class="resize-handle"></div>
  `;

  // Set text content safely (not innerHTML) to avoid injection
  win.querySelector('.text-viewer-content').textContent = content;

  // Close button — remove from DOM and tracking array
  win.querySelector('.close-btn').addEventListener('click', () => {
    win.remove();
    notepadWindows = notepadWindows.filter(w => w !== win);
  });

  // Drag via title bar
  const titleBar = win.querySelector('.title-bar');
  titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.title-btn')) return;
    dragWindow = win;
    dragOffsetX = e.clientX - win.offsetLeft;
    dragOffsetY = e.clientY - win.offsetTop;
    titleBar.style.cursor = 'grabbing';
    bringToFront(win);
  });

  // Resize handle
  const handle = win.querySelector('.resize-handle');
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    resizeWindow = win;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = win.offsetWidth;
    resizeStartH = win.offsetHeight;
    bringToFront(win);
  });

  // Focus on click
  win.addEventListener('mousedown', () => {
    bringToFront(win);
  });

  // Tooltips on title-bar buttons
  win.querySelectorAll('.title-btn[data-tooltip]').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const text = btn.dataset.tooltip;
      tooltipTimeout = setTimeout(() => {
        tooltipEl.textContent = text;
        tooltipEl.classList.add('visible');
        const rect = btn.getBoundingClientRect();
        tooltipEl.style.left = rect.left + 'px';
        tooltipEl.style.top = (rect.bottom + 4) + 'px';
      }, 400);
    });
    btn.addEventListener('mouseleave', () => {
      clearTimeout(tooltipTimeout);
      tooltipEl.classList.remove('visible');
    });
    btn.addEventListener('mousedown', () => {
      clearTimeout(tooltipTimeout);
      tooltipEl.classList.remove('visible');
    });
  });

  desktop.appendChild(win);
  notepadWindows.push(win);
  bringToFront(win);
}

// === Back Button ===
backBtn.addEventListener('click', () => {
  if (currentPath === 'C:\\') return;
  const parts = currentPath.split('\\').filter(Boolean);
  parts.pop();
  const parentPath = parts.length <= 1 ? 'C:\\' : 'C:\\' + parts.slice(1).join('\\');
  renderFolder(parentPath);
});

// === File Explorer Toggle ===
explorerButton.addEventListener('click', () => {
  if (fileExplorer.classList.contains('hidden')) {
    fileExplorer.classList.remove('hidden');
    bringToFront(fileExplorer);
  } else {
    fileExplorer.classList.add('hidden');
  }
});

// === Notepad Taskbar Toggle ===
const notepadTaskbarButton = document.getElementById('notepad-taskbar-button');

notepadTaskbarButton.addEventListener('click', () => {
  if (notepadWindows.length === 0) return;
  const anyVisible = notepadWindows.some(w => !w.classList.contains('hidden'));
  notepadWindows.forEach(w => {
    if (anyVisible) {
      w.classList.add('hidden');
    } else {
      w.classList.remove('hidden');
      bringToFront(w);
    }
  });
});

// === Close Buttons (attach to all current and use event delegation) ===
document.querySelectorAll('.window').forEach(win => {
  win.querySelector('.close-btn').addEventListener('click', () => {
    win.classList.add('hidden');
    // Stop IE from loading when closed
    if (win.id === 'ie-window') {
      ieFrame.src = 'about:blank';
    }
  });
});

// === Window Focus / Z-Index ===
let topZ = 51;

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
  document.querySelectorAll('.window .title-bar').forEach(tb => tb.classList.add('inactive'));
  win.querySelector('.title-bar').classList.remove('inactive');
}

document.querySelectorAll('.window').forEach(win => {
  win.addEventListener('mousedown', () => {
    bringToFront(win);
  });
});

// === Window Dragging ===
let dragWindow = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.querySelectorAll('.title-bar').forEach(titleBar => {
  titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.title-btn')) return;
    const win = titleBar.closest('.window');
    dragWindow = win;
    dragOffsetX = e.clientX - win.offsetLeft;
    dragOffsetY = e.clientY - win.offsetTop;
    titleBar.style.cursor = 'grabbing';
    bringToFront(win);
  });
});

document.addEventListener('mousemove', (e) => {
  if (dragWindow) {
    dragWindow.style.left = (e.clientX - dragOffsetX) + 'px';
    dragWindow.style.top = (e.clientY - dragOffsetY) + 'px';
    return;
  }
  if (resizeWindow) {
    const newW = resizeStartW + (e.clientX - resizeStartX);
    const newH = resizeStartH + (e.clientY - resizeStartY);
    resizeWindow.style.width = Math.max(250, newW) + 'px';
    resizeWindow.style.height = Math.max(150, newH) + 'px';
    return;
  }
});

document.addEventListener('mouseup', () => {
  if (dragWindow) {
    dragWindow.querySelector('.title-bar').style.cursor = 'grab';
    dragWindow = null;
  }
  if (resizeWindow) {
    resizeWindow = null;
  }
});

// === Window Resizing ===
let resizeWindow = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartW = 0;
let resizeStartH = 0;

document.querySelectorAll('.resize-handle').forEach(handle => {
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    const win = handle.closest('.window');
    resizeWindow = win;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = win.offsetWidth;
    resizeStartH = win.offsetHeight;
    bringToFront(win);
  });
});

// === Tooltips ===
let tooltipTimeout = null;

document.querySelectorAll('.title-btn[data-tooltip]').forEach(btn => {
  btn.addEventListener('mouseenter', (e) => {
    const text = btn.dataset.tooltip;
    tooltipTimeout = setTimeout(() => {
      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');
      const rect = btn.getBoundingClientRect();
      tooltipEl.style.left = rect.left + 'px';
      tooltipEl.style.top = (rect.bottom + 4) + 'px';
    }, 400);
  });

  btn.addEventListener('mouseleave', () => {
    clearTimeout(tooltipTimeout);
    tooltipEl.classList.remove('visible');
  });

  btn.addEventListener('mousedown', () => {
    clearTimeout(tooltipTimeout);
    tooltipEl.classList.remove('visible');
  });
});

// === Taskbar Tooltips ===
document.querySelectorAll('#taskbar button[data-tooltip]').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const text = btn.dataset.tooltip;
    tooltipTimeout = setTimeout(() => {
      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');
      const rect = btn.getBoundingClientRect();
      tooltipEl.style.left = rect.left + 'px';
      tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 4) + 'px';
    }, 400);
  });

  btn.addEventListener('mouseleave', () => {
    clearTimeout(tooltipTimeout);
    tooltipEl.classList.remove('visible');
  });

  btn.addEventListener('mousedown', () => {
    clearTimeout(tooltipTimeout);
    tooltipEl.classList.remove('visible');
  });
});

// === Internet Explorer ===
// Custom history stack (cross-origin iframes block the browser history API)
let ieHistory = [];
let ieHistoryIndex = -1;
let ieProgrammatic = false; // true when we initiated the navigation

function updateIEButtons() {
  ieBack.disabled = ieHistoryIndex <= 0;
  ieForward.disabled = ieHistoryIndex >= ieHistory.length - 1;
}

function openIE() {
  ieWindow.classList.remove('hidden');
  bringToFront(ieWindow);
  if (ieHistory.length === 0) {
    navigateIE(IE_HOME);
  }
}

ieDesktopIcon.addEventListener('dblclick', openIE);

ieTaskbarButton.addEventListener('click', () => {
  if (ieWindow.classList.contains('hidden')) {
    openIE();
  } else {
    ieWindow.classList.add('hidden');
    ieFrame.src = 'about:blank';
  }
});

function navigateIE(url, skipHistory) {
  if (!url || url === 'about:blank') return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (!skipHistory) {
    // Trim forward history when navigating to a new page
    ieHistory = ieHistory.slice(0, ieHistoryIndex + 1);
    ieHistory.push(url);
    ieHistoryIndex = ieHistory.length - 1;
  }

  ieAddress.value = url;
  ieStatus.textContent = 'Loading...';
  ieProgrammatic = true;
  ieFrame.src = url;
  ieTitle.textContent = url + ' - Internet Explorer';
  updateIEButtons();
}

ieGo.addEventListener('click', () => {
  navigateIE(ieAddress.value.trim());
});

ieAddress.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    navigateIE(ieAddress.value.trim());
  }
});

ieBack.addEventListener('click', () => {
  if (ieHistoryIndex > 0) {
    ieHistoryIndex--;
    navigateIE(ieHistory[ieHistoryIndex], true);
  }
});

ieForward.addEventListener('click', () => {
  if (ieHistoryIndex < ieHistory.length - 1) {
    ieHistoryIndex++;
    navigateIE(ieHistory[ieHistoryIndex], true);
  }
});

ieRefresh.addEventListener('click', () => {
  if (ieHistoryIndex >= 0 && ieHistory[ieHistoryIndex]) {
    navigateIE(ieHistory[ieHistoryIndex], true);
  }
});

ieHome.addEventListener('click', () => {
  navigateIE(IE_HOME);
});

ieFrame.addEventListener('load', () => {
  ieStatus.textContent = 'Done';

  // Try to read the URL the iframe actually loaded
  let loadedUrl = null;
  try {
    const href = ieFrame.contentWindow.location.href;
    if (href && href !== 'about:blank') {
      loadedUrl = href;
      ieAddress.value = href;
      ieTitle.textContent = (ieFrame.contentDocument.title || href) + ' - Internet Explorer';
    }
  } catch(e) {
    // cross-origin — can't read URL
  }

  // If user clicked a link inside the iframe (not our code), track it
  if (!ieProgrammatic) {
    const url = loadedUrl || ieAddress.value;
    if (url && url !== 'about:blank') {
      ieHistory = ieHistory.slice(0, ieHistoryIndex + 1);
      ieHistory.push(url);
      ieHistoryIndex = ieHistory.length - 1;
    }
  }

  ieProgrammatic = false;
  updateIEButtons();
});

// === Taskbar Clock ===
const clock = document.getElementById('taskbar-clock');

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  clock.textContent = hours + ':' + minutes + ' ' + ampm;
}

updateClock();
setInterval(updateClock, 10000);

// === Initial Render ===
renderFolder('C:\\');
