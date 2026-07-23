window.addEventListener("DOMContentLoaded", (event) => {
  // Initialize page layout and structure
  const generateLayout = () => {
    const body = document.body;
    body.className = "sb-nav-fixed";

    // Top navigation bar section
    const topSection = `
      <nav class="sb-topnav navbar navbar-expand navbar-dark bg-dark">
        <button class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#!">
          <i class="fas fa-bars"></i>
        </button>
        <a class="navbar-brand ps-3" href="/">Predictrix</a>
      </nav>
    `;

    // Sidenav and main content container
    const bottomSection = `
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <nav class="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
            <div class="sb-sidenav-menu">
              <div class="nav">
                <div class="sb-sidenav-menu-heading"></div>
                
                <a class="nav-link" href="/">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-history"></i>
                  </div>
                  Writing History
                </a>
                <div class="sb-sidenav-menu-heading">Assignment</div>
                <a class="nav-link" href="/test1_writing">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-columns"></i>
                  </div>
                  Pre-Test
                </a>
                <a class="nav-link" href="/hw1_writing">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-book-open"></i>
                  </div>
                  Homework 1
                </a>
                <a class="nav-link" href="/hw2_writing">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-book-open"></i>
                  </div>
                  Homework 2
                </a>
                <a class="nav-link" href="/test2_writing">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-columns"></i>
                  </div>
                  Post-Test
                </a>

                <div class="sb-sidenav-menu-heading">Guide</div>
                <a class="nav-link" href="/hw_writing_setup_instruct">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                  </div>
                   How to upload picture
                </a>
                <a class="nav-link" href="/hw_writing_instruct">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                  </div>
                  How to write and submit your homework
                </a>             

                <div class="sb-sidenav-menu-heading">Goodbye</div>
                <a class="nav-link" href="/login" onclick="handleSignOut(event)">
                  <div class="sb-nav-link-icon">
                    <i class="fas fa-power-off"></i>
                  </div>
                  Sign Out
                </a>
              </div>
            </div>
          </nav>
        </div>
        <div id="layoutSidenav_content">
          <main>
          </main>
        </div>
      </div>
    `;

    body.innerHTML = topSection + bottomSection;
  };

  generateLayout();

  // Sidebar toggle interaction
  const sidebarToggle = document.body.querySelector("#sidebarToggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (event) => {
      event.preventDefault();
      document.body.classList.toggle("sb-sidenav-toggled");
      localStorage.setItem(
        "sb|sidebar-toggle",
        document.body.classList.contains("sb-sidenav-toggled")
      );
    });
  }
});

// Logout handler to clear session data
function handleSignOut(event) {
  sessionStorage.clear();
}
