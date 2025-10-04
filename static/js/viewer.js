// Viewer.js - Xử lý hiển thị mindmap và các tính năng tương tác

// Global variables
let mindmapData = null;
let searchTimeout = null;
let currentSheet = null;

// Authentication và initialization
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded!");
  console.log(
    "Checking MINDMAP_DATA:",
    typeof window.MINDMAP_DATA !== "undefined" ? "AVAILABLE" : "NOT FOUND"
  );

  // Nếu đã từng vào viewer rồi (reload) thì về login
  if (sessionStorage.getItem("hasVisitedViewer")) {
    sessionStorage.clear();
    window.location.href = "./index.html";
    return;
  }

  // Đánh dấu đã vào viewer lần đầu
  sessionStorage.setItem("hasVisitedViewer", "true");

  // Authentication disabled for mindmap viewer
  console.log("Authentication disabled, initializing viewer...");

  // Initialize viewer
  initializeViewer();
});

// Kiểm tra authentication
function isAuthenticated() {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

// Chuyển hướng về trang login
function redirectToLogin() {
  sessionStorage.clear();
  window.location.href = "./index.html";
}

// Khởi tạo viewer
function initializeViewer() {
  console.log("Initializing viewer...");
  setupEventListeners();
  console.log("Event listeners set up, loading mindmap data...");
  loadMindmapData();
}

// Setup các event listeners
function setupEventListeners() {
  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", function () {
    logout();
  });

  // Search functionality
  let currentSearchIndex = 0;
  let searchResults = [];

  document.getElementById("searchBox").addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTopics(e.target.value.toLowerCase());
    }, 300);
  });

  // Search box Enter key navigation
  document
    .getElementById("searchBox")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        navigateToNextResult();
      }
    });

  // Ctrl+F to open search sidebar
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      openSearchSidebar();
    }
    if (e.key === "Escape") {
      closeSearchSidebar();
    }
  });

  // Search sidebar controls
  document
    .getElementById("closeSidebarBtn")
    .addEventListener("click", closeSearchSidebar);

  // Expand/Collapse all buttons
  document
    .getElementById("expandAllBtn")
    .addEventListener("click", expandAllTopics);
  document
    .getElementById("collapseAllBtn")
    .addEventListener("click", collapseAllTopics);

  // Error modal buttons
  document.getElementById("retryBtn").addEventListener("click", function () {
    hideErrorModal();
    loadMindmapData();
  });

  document
    .getElementById("backToLoginBtn")
    .addEventListener("click", function () {
      logout();
    });

  // Notes modal event listeners
  document
    .getElementById("closeNotesModal")
    .addEventListener("click", hideNotesModal);
  document
    .getElementById("closeNotesBtn")
    .addEventListener("click", hideNotesModal);

  // Click outside modal to close
  document.getElementById("notesModal").addEventListener("click", function (e) {
    if (e.target === this) {
      hideNotesModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Close modal with Escape
    if (e.key === "Escape") {
      hideNotesModal();
      document.getElementById("searchBox").value = "";
      searchTopics("");
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "f":
        case "F":
          e.preventDefault();
          document.getElementById("searchBox").focus();
          break;
        case "e":
        case "E":
          e.preventDefault();
          expandAllTopics();
          break;
        case "r":
        case "R":
          e.preventDefault();
          collapseAllTopics();
          break;
      }
    }
  });
}

// Load dữ liệu mindmap từ embedded JSON
function loadMindmapData() {
  console.log("Starting loadMindmapData...");

  try {
    // Đọc JSON data từ script tag
    const dataScript = document.getElementById("mindmap-data");
    console.log("Found data script element:", !!dataScript);

    if (!dataScript || !dataScript.textContent.trim()) {
      throw new Error("Không tìm thấy dữ liệu mindmap trong trang");
    }

    console.log("Data script content length:", dataScript.textContent.length);
    mindmapData = JSON.parse(dataScript.textContent);
    console.log("Mindmap data loaded successfully:", mindmapData);

    if (mindmapData && mindmapData.sheets && mindmapData.sheets.length > 0) {
      currentSheet = mindmapData.sheets[0];
      console.log("Current sheet:", currentSheet.title);
      document.getElementById("mindmapTitle").textContent =
        currentSheet.title || "XMind Viewer";

      // Render mindmap
      console.log("Starting to render mindmap...");
      renderMindmap(currentSheet.root_topic);
      console.log("Mindmap rendered successfully...");
    } else {
      throw new Error("Dữ liệu mindmap không hợp lệ");
    }
  } catch (error) {
    console.error("Error loading mindmap data:", error);
    showErrorModal("Không thể tải dữ liệu mindmap: " + error.message);
  }
}

// Hiển thị error modal
function showErrorModal(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorModal").classList.remove("hidden");
}

// Ẩn error modal
function hideErrorModal() {
  document.getElementById("errorModal").classList.add("hidden");
}

// Render mindmap tree structure với layout cải tiến
function renderMindmap(rootTopic) {
  const container = document.getElementById("mindmapContainer");
  container.innerHTML = "";

  if (!rootTopic) {
    container.innerHTML =
      '<div class="text-center text-gray-400 p-8">Không có dữ liệu để hiển thị</div>';
    return;
  }

  const mindmapTree = createTopicElement(rootTopic, 0, true);
  container.appendChild(mindmapTree);

  // Thêm fade-in animation
  setTimeout(() => {
    container.classList.add("animate-fade-in");
  }, 100);
}

// Tạo phần tử topic với style cải tiến
function createTopicElement(topic, level, isRoot = false) {
  const topicDiv = document.createElement("div");
  topicDiv.className = `topic-item ${isRoot ? "root-topic" : ""} mb-0`;
  topicDiv.setAttribute("data-topic-id", topic.id);
  topicDiv.setAttribute("data-level", level.toString());

  // Create topic header
  const headerDiv = document.createElement("div");
  headerDiv.className = `topic-header flex items-center space-x-0.5 cursor-pointer transition-all duration-200 hover:shadow-lg`;

  // Icons for notes and links - ĐẶT Ở ĐẦU
  const iconsDiv = document.createElement("div");
  iconsDiv.className = "flex items-center space-x-1 flex-shrink-0";

  if (topic.notes && topic.notes.trim()) {
    const noteIcon = document.createElement("button");
    noteIcon.className =
      "note-icon text-amber-600 hover:text-amber-800 p-1 rounded transition-all duration-200 hover:scale-110 bg-amber-50 hover:bg-amber-100 border border-amber-200";
    noteIcon.innerHTML = '<i class="fas fa-sticky-note text-xs"></i>';
    noteIcon.title = "Xem ghi chú";
    noteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      showNotesPopup(e.target, topic.title, topic.notes);
    });
    iconsDiv.appendChild(noteIcon);
  }

  if (topic.hyperlink && topic.hyperlink.trim()) {
    const linkIcon = document.createElement("button");
    linkIcon.className =
      "link-icon text-blue-600 hover:text-blue-800 p-1 rounded transition-all duration-200 hover:scale-110 bg-blue-50 hover:bg-blue-100 border border-blue-200";
    linkIcon.innerHTML = '<i class="fas fa-external-link-alt text-xs"></i>';
    linkIcon.title = "Mở liên kết";
    linkIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(topic.hyperlink, "_blank", "noopener,noreferrer");
    });
    iconsDiv.appendChild(linkIcon);
  }

  headerDiv.appendChild(iconsDiv);

  // Expand/collapse button
  if (topic.children && topic.children.length > 0) {
    const expandBtn = document.createElement("button");
    expandBtn.className =
      "expand-btn flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all duration-200";
    expandBtn.innerHTML = '<i class="fas fa-minus-circle text-sm"></i>';
    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTopic(topicDiv);
    });
    headerDiv.appendChild(expandBtn);
  } else {
    // Dot indicator for leaf nodes
    const dot = document.createElement("div");
    dot.className = "w-2 h-2 rounded-full bg-gray-400 flex-shrink-0";
    headerDiv.appendChild(dot);
  }

  // Topic title
  const titleSpan = document.createElement("span");
  titleSpan.className = `topic-title flex-1 break-words ${
    isRoot ? "font-bold text-sm" : "font-normal text-xs"
  }`;
  titleSpan.textContent = topic.title || "Untitled Topic";
  headerDiv.appendChild(titleSpan);

  // Add double click handler with proper event management
  if (topic.children && topic.children.length > 0) {
    let clickCount = 0;
    headerDiv.addEventListener(
      "click",
      (e) => {
        clickCount++;
        if (clickCount === 1) {
          setTimeout(() => {
            if (clickCount === 2) {
              // Double click detected
              e.preventDefault();
              e.stopImmediatePropagation();
              toggleTopic(topicDiv);
            }
            clickCount = 0;
          }, 300);
        }
      },
      true
    );
  }

  topicDiv.appendChild(headerDiv);

  // Create children container
  if (topic.children && topic.children.length > 0) {
    const childrenDiv = document.createElement("div");
    childrenDiv.className = `children-container space-y-0 ${
      topic.branch_folded ? "hidden" : ""
    }`;

    topic.children.forEach((child) => {
      const childElement = createTopicElement(child, level + 1);
      childrenDiv.appendChild(childElement);
    });

    topicDiv.appendChild(childrenDiv);
  }

  return topicDiv;
}

// Toggle topic expand/collapse
function toggleTopic(topicElement) {
  const childrenContainer = topicElement.querySelector(".children-container");
  const expandBtn = topicElement.querySelector(".expand-btn i");

  if (childrenContainer && expandBtn) {
    const isHidden = childrenContainer.classList.contains("hidden");

    if (isHidden) {
      childrenContainer.classList.remove("hidden");
      expandBtn.className = "fas fa-minus-circle text-lg";
      childrenContainer.style.animation = "slideDown 0.3s ease-out";
    } else {
      childrenContainer.classList.add("hidden");
      expandBtn.className = "fas fa-plus-circle text-lg";
    }
  }
}

// Highlight element
function highlightElement(element) {
  element.classList.add("highlight");
  setTimeout(() => element.classList.remove("highlight"), 2000);
}

// Tooltip functions
function showTooltip(event, content) {
  const tooltip = document.getElementById("tooltip");
  const tooltipContent = document.getElementById("tooltipContent");

  tooltipContent.innerHTML = content.replace(/\n/g, "<br>");
  tooltip.classList.remove("hidden");

  const rect = event.target.getBoundingClientRect();
  tooltip.style.left =
    Math.min(rect.right + 10, window.innerWidth - tooltip.offsetWidth - 10) +
    "px";
  tooltip.style.top = rect.top + "px";
}

function hideTooltip() {
  document.getElementById("tooltip").classList.add("hidden");
}

// Show notes popup - popup nhỏ dưới element thay vì modal lớn
function showNotesPopup(targetElement, title, notes) {
  // Xóa popup cũ nếu có
  const existingPopup = document.getElementById("notesPopup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Tạo popup mới
  const popup = document.createElement("div");
  popup.id = "notesPopup";
  popup.className =
    "fixed bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 max-w-sm";
  popup.style.minWidth = "200px";
  popup.style.maxHeight = "300px";

  // Close button only - no title
  const closeBtn = document.createElement("button");
  closeBtn.className =
    "absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 z-10";
  closeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
  closeBtn.onclick = () => popup.remove();

  // Content only
  const content = document.createElement("div");
  content.className = "text-sm text-gray-700 leading-relaxed overflow-y-auto";
  content.style.maxHeight = "250px";
  content.innerHTML = notes
    ? notes.replace(/\n/g, "<br>")
    : "Không có ghi chú nào.";

  popup.appendChild(closeBtn);
  popup.appendChild(content);
  document.body.appendChild(popup);

  // Position popup dưới element
  const rect = targetElement.getBoundingClientRect();
  popup.style.left = rect.left + "px";
  popup.style.top = rect.bottom + 5 + "px";

  // Đảm bảo popup không ra ngoài màn hình
  const popupRect = popup.getBoundingClientRect();
  if (popupRect.right > window.innerWidth) {
    popup.style.left = window.innerWidth - popupRect.width - 10 + "px";
  }
  if (popupRect.bottom > window.innerHeight) {
    popup.style.top = rect.top - popupRect.height - 5 + "px";
  }

  // Click outside để đóng
  setTimeout(() => {
    const clickOutside = (e) => {
      if (!popup.contains(e.target) && !targetElement.contains(e.target)) {
        popup.remove();
        document.removeEventListener("click", clickOutside);
      }
    };
    document.addEventListener("click", clickOutside);
  }, 100);
}

// Show notes modal
function showNotesModal(title, notes) {
  const modal = document.getElementById("notesModal");
  const modalTitle = document
    .getElementById("notesTitle")
    .querySelector("span");
  const modalContent = document.getElementById("notesContent");

  modalTitle.textContent = title || "Ghi chú";
  modalContent.innerHTML = notes
    ? notes.replace(/\n/g, "<br>")
    : "Không có ghi chú nào.";

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Thêm fade-in animation
  setTimeout(() => {
    const modalDialog = modal.querySelector(".bg-white");
    if (modalDialog) {
      modalDialog.style.transform = "scale(1)";
      modalDialog.style.opacity = "1";
    }
  }, 10);
}

// Hide notes modal
function hideNotesModal() {
  const modal = document.getElementById("notesModal");
  const modalContent = modal.querySelector(".bg-white");

  // Fade-out animation
  if (modalContent) {
    modalContent.style.transform = "scale(0.95)";
    modalContent.style.opacity = "0";
  }

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    if (modalContent) {
      modalContent.style.transform = "scale(1)";
      modalContent.style.opacity = "1";
    }
  }, 200);
}

// Search functionality with sidebar
function searchTopics(query) {
  const allTopics = document.querySelectorAll(".topic-item");
  searchResults = [];
  currentSearchIndex = 0;

  allTopics.forEach((topic) => {
    const titleElement = topic.querySelector(".topic-title");
    if (!titleElement) return;

    const title = titleElement.textContent.toLowerCase();
    const hasMatch = title.includes(query);

    if (query === "") {
      topic.classList.remove("search-highlight", "search-dim");
    } else if (hasMatch) {
      topic.classList.add("search-highlight");
      topic.classList.remove("search-dim");
      expandParentTopics(topic);
      searchResults.push({
        element: topic,
        title: titleElement.textContent,
        path: getNodePath(topic),
      });
    } else {
      topic.classList.remove("search-highlight");
      topic.classList.add("search-dim");
    }
  });

  updateSearchSidebar(query, searchResults);
  updateSearchBoxStyle(query, searchResults.length > 0);
}

// Search sidebar functions
function openSearchSidebar() {
  const sidebar = document.getElementById("searchSidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.style.width = "320px";
  mainContent.style.marginLeft = "320px";
  document.getElementById("searchBox").focus();
}

function closeSearchSidebar() {
  const sidebar = document.getElementById("searchSidebar");
  const mainContent = document.getElementById("mainContent");
  sidebar.style.width = "0px";
  mainContent.style.marginLeft = "0px";

  // Reset search box value
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    searchBox.value = "";
  }

  // Clear all search highlights and focus
  clearSearchHighlights();
}

function updateSearchSidebar(query, results) {
  const resultsContainer = document.getElementById("searchResults");
  const countElement = document.getElementById("searchResultCount");

  countElement.textContent = `${results.length} kết quả`;
  resultsContainer.innerHTML = "";

  if (query && results.length > 0) {
    openSearchSidebar();

    results.forEach((result, index) => {
      const resultDiv = document.createElement("div");
      resultDiv.className = `p-3 border-b hover:bg-gray-50 cursor-pointer ${
        index === currentSearchIndex
          ? "bg-blue-50 border-l-4 border-l-blue-500"
          : ""
      }`;
      resultDiv.innerHTML = `
        <div class="font-medium text-sm">${highlightText(
          result.title,
          query
        )}</div>
        <div class="text-xs text-gray-500 mt-1">${result.path}</div>
      `;
      resultDiv.addEventListener("click", () => {
        currentSearchIndex = index;
        focusOnNode(result.element);
        updateSidebarSelection();
      });
      resultsContainer.appendChild(resultDiv);
    });
  } else if (query) {
    openSearchSidebar();
    resultsContainer.innerHTML =
      '<div class="p-4 text-gray-500 text-center">Không tìm thấy kết quả</div>';
  } else {
    closeSearchSidebar();
  }
}

function updateSearchBoxStyle(query, hasResults) {
  const searchBox = document.getElementById("searchBox");
  if (query && !hasResults) {
    searchBox.classList.add("border-red-500");
    searchBox.classList.remove("border-green-500");
  } else if (query && hasResults) {
    searchBox.classList.remove("border-red-500");
    searchBox.classList.add("border-green-500");
  } else {
    searchBox.classList.remove("border-red-500", "border-green-500");
  }
}

function navigateToNextResult() {
  if (searchResults.length === 0) return;

  currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
  focusOnNode(searchResults[currentSearchIndex].element);
  updateSidebarSelection();
}

function focusOnNode(nodeElement) {
  // Remove previous focus
  document
    .querySelectorAll(".search-focus")
    .forEach((el) => el.classList.remove("search-focus"));

  // Add focus to current node
  nodeElement.classList.add("search-focus");

  // Scroll to node
  nodeElement.scrollIntoView({ behavior: "smooth", block: "center" });

  // Ensure all parent nodes are expanded
  expandParentTopics(nodeElement);
}

function clearSearchHighlights() {
  // Remove all search-related classes
  document
    .querySelectorAll(".search-highlight, .search-focus, .search-dim")
    .forEach((el) =>
      el.classList.remove("search-highlight", "search-focus", "search-dim")
    );

  // Reset search results array and index
  searchResults = [];
  currentSearchIndex = 0;

  // Clear sidebar content
  const resultsContainer = document.getElementById("searchResults");
  const countElement = document.getElementById("searchResultCount");
  if (resultsContainer) resultsContainer.innerHTML = "";
  if (countElement) countElement.textContent = "0 kết quả";
}

function updateSidebarSelection() {
  const resultItems = document.querySelectorAll("#searchResults > div");
  resultItems.forEach((item, index) => {
    if (index === currentSearchIndex) {
      item.className =
        "p-3 border-b hover:bg-gray-50 cursor-pointer bg-blue-50 border-l-4 border-l-blue-500";
    } else {
      item.className = "p-3 border-b hover:bg-gray-50 cursor-pointer";
    }
  });
}

function getNodePath(nodeElement) {
  const path = [];
  let current = nodeElement;

  while (current && current.classList.contains("topic-item")) {
    const titleElement = current.querySelector(".topic-title");
    if (titleElement) {
      path.unshift(titleElement.textContent);
    }
    current = current.parentElement?.closest(".topic-item");
  }

  return path.join(" > ");
}

function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

// Expand parent topics để hiện search results
function expandParentTopics(element) {
  let parent = element.parentElement;
  while (parent) {
    if (
      parent.classList.contains("children-container") &&
      parent.classList.contains("hidden")
    ) {
      parent.classList.remove("hidden");
      const expandBtn = parent.parentElement.querySelector(".expand-btn i");
      if (expandBtn) expandBtn.className = "fas fa-minus-circle text-sm";
    }
    parent = parent.parentElement;
  }
}

// Expand tất cả topics
function expandAllTopics() {
  const allChildrenContainers = document.querySelectorAll(
    ".children-container"
  );
  const allExpandBtns = document.querySelectorAll(".expand-btn i");

  allChildrenContainers.forEach((container) =>
    container.classList.remove("hidden")
  );
  allExpandBtns.forEach(
    (btn) => (btn.className = "fas fa-minus-circle text-sm")
  );
}

// Collapse tất cả topics
function collapseAllTopics() {
  const allChildrenContainers = document.querySelectorAll(
    ".children-container"
  );
  const allExpandBtns = document.querySelectorAll(".expand-btn i");

  allChildrenContainers.forEach((container) =>
    container.classList.add("hidden")
  );
  allExpandBtns.forEach(
    (btn) => (btn.className = "fas fa-plus-circle text-sm")
  );
}

// Logout function
function logout() {
  sessionStorage.clear();

  // Fade out effect
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.3s ease-out";

  setTimeout(() => {
    window.location.href = "./index.html";
  }, 300);
}

// Utility functions
function getCurrentUser() {
  return sessionStorage.getItem("username") || "Anonymous";
}

// Error handling
window.addEventListener("error", function (e) {
  console.error("JavaScript error:", e.error);
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("Unhandled promise rejection:", e.reason);
});

if (!sessionStorage.getItem("isLoggedIn")) {
  window.location.href = "./index.html";
}
