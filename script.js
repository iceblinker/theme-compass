(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNavigation(menuButton, menuList);
    });

    menuList.addEventListener("keyup", (event) => {
      if (event.keyCode === ESCAPE) {
        event.stopPropagation();
        closeNavigation(menuButton, menuList);
      }
    });

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.removeAttribute("aria-expanded");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", true);
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  // To learn more about this, see:
  // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
  // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms

  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

})();

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     FEATURE-RICH KB SCRIPTS
     ========================================================================== */

  // --- Command Palette (Cmd/Ctrl + K) ---
  // This script creates a command palette that allows users to quickly navigate to links on the page.
  const commandPaletteOverlay = document.getElementById('commandPaletteOverlay');
  const commandPaletteInput = document.getElementById('commandPaletteInput');
  const commandPaletteResults = document.getElementById('commandPaletteResults');

  const openPalette = () => {
    if (!commandPaletteOverlay) return;
    commandPaletteOverlay.style.display = 'flex';
    commandPaletteInput.value = '';
    buildPaletteResults('');
    commandPaletteInput.focus();
  };

  const closePalette = () => {
    if (!commandPaletteOverlay) return;
    commandPaletteOverlay.style.display = 'none';
  };

  const buildPaletteResults = (query) => {
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const uniqueLinks = allLinks.reduce((acc, link) => {
      if (link.href && link.innerText.trim() && !acc.some(l => l.href === link.href)) {
        acc.push({ href: link.href, text: link.innerText.trim() });
      }
      return acc;
    }, []);
    
    const filtered = uniqueLinks.filter(link => link.text.toLowerCase().includes(query.toLowerCase()));
    
    commandPaletteResults.innerHTML = '';
    filtered.slice(0, 10).forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.onclick = closePalette; // Close palette when a link is clicked
      li.appendChild(a);
      commandPaletteResults.appendChild(li);
    });
  };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape' && commandPaletteOverlay.style.display === 'flex') {
      closePalette();
    }
  });

  if (commandPaletteInput) {
    commandPaletteInput.addEventListener('input', () => buildPaletteResults(commandPaletteInput.value));
    commandPaletteOverlay.addEventListener('click', (e) => {
      if (e.target === commandPaletteOverlay) {
        closePalette();
      }
    });
  }


  // --- "On this page" Sticky TOC ---
  // This script generates a table of contents based on headings in the article body.
  const tocContainer = document.getElementById('toc-container');
  const articleBody = document.querySelector('.article-body');

  if (tocContainer && articleBody) {
    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length > 1) {
      const tocList = document.createElement('ul');
      tocList.className = 'toc-list';
      let tocTitle = document.createElement('h3');
      tocTitle.textContent = 'On this page';
      tocContainer.appendChild(tocTitle);
      
      headings.forEach((heading, i) => {
        const id = 'toc-heading-' + i;
        heading.id = id;
        
        const li = document.createElement('li');
        li.className = 'toc-level-' + heading.tagName.toLowerCase().charAt(1);
        
        const a = document.createElement('a');
        a.textContent = heading.textContent;
        a.href = '#' + id;
        
        li.appendChild(a);
        tocList.appendChild(li);
      });
      
      tocContainer.appendChild(tocList);

      const tocLinks = tocContainer.querySelectorAll('a');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = entry.target.getAttribute('id');
          const correspondingLink = tocContainer.querySelector(`a[href="#${id}"]`);
          if (entry.isIntersecting) {
            tocLinks.forEach(link => link.classList.remove('is-active'));
            correspondingLink.classList.add('is-active');
          }
        });
      }, { rootMargin: "0px 0px -80% 0px" });

      headings.forEach(heading => observer.observe(heading));
    }
  }

  // --- Image Comparison Slider ---
  // This script allows users to compare two images by sliding a handle.
  document.querySelectorAll('.comparison-slider').forEach(slider => {
    let isDragging = false;
    const handle = slider.querySelector('.slider-handle');
    const topImg = slider.querySelector('.img-top');

    const onDrag = (e) => {
      if (!isDragging) return;
      const rect = slider.getBoundingClientRect();
      let x = (e.clientX || e.touches[0].clientX) - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      topImg.style.width = (x / rect.width) * 100 + '%';
      handle.style.left = (x / rect.width) * 100 + '%';
    };

    handle.addEventListener('mousedown', () => isDragging = true);
    handle.addEventListener('touchstart', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag);
  });

  // --- Click-to-Zoom Images ---
  // This script allows users to click on images to zoom in.
  // It creates an overlay with the zoomed image and closes it on click.
  if (articleBody) {
    articleBody.querySelectorAll('img').forEach(img => {
      if (!img.closest('a')) { // Don't apply to images that are already links
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.className = 'image-zoom-overlay';
          const zoomedImg = document.createElement('img');
          zoomedImg.src = img.src;
          overlay.appendChild(zoomedImg);
          document.body.appendChild(overlay);

          // Show with a slight delay for transition
          setTimeout(() => overlay.classList.add('visible'), 10);
          
          overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
          });
        });
      }
    });
  }

  // --- Article Reading Progress Bar ---
  // This script creates a reading progress bar that fills as the user scrolls down the article.
  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress-bar';
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = progress + '%';
  });
  
  // --- Interactive Checklists ---
  // This script allows users to check off items in a checklist.
  // It toggles a 'checked' class on list items when clicked.
  document.querySelectorAll('.interactive-checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });

});

document.addEventListener('DOMContentLoaded', () => {

  // --- Command Palette (Cmd/Ctrl + K) ---
  // This script creates a command palette that allows users to quickly navigate to links on the page.
  // It opens with Cmd/Ctrl + K and filters links based on user input.
  const commandPaletteOverlay = document.getElementById('commandPaletteOverlay');
  const commandPaletteInput = document.getElementById('commandPaletteInput');
  const commandPaletteResults = document.getElementById('commandPaletteResults');

  if (commandPaletteOverlay && commandPaletteInput && commandPaletteResults) {
    const openPalette = () => {
      commandPaletteOverlay.style.display = 'flex';
      buildPaletteResults('');
      commandPaletteInput.focus();
    };

    const closePalette = () => {
      commandPaletteOverlay.style.display = 'none';
      commandPaletteInput.value = '';
    };

    const buildPaletteResults = (query) => {
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const uniqueLinks = allLinks.reduce((acc, link) => {
        const text = link.innerText.trim();
        const href = link.href;
        // Filter out irrelevant links and duplicates
        if (text && href && !href.includes('javascript:void(0)') && !acc.some(l => l.href === href || l.text === text)) {
           if (!link.closest('.pagination')) { // Exclude pagination links
             acc.push({ href: href, text: text });
           }
        }
        return acc;
      }, []);
      
      const filtered = uniqueLinks.filter(link => link.text.toLowerCase().includes(query.toLowerCase()));
      
      commandPaletteResults.innerHTML = ''; // Clear previous results
      filtered.slice(0, 10).forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.onclick = closePalette; // Close palette when a link is clicked
        li.appendChild(a);
        commandPaletteResults.appendChild(li);
      });
    };

    // Open palette with Cmd/Ctrl + K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape' && commandPaletteOverlay.style.display === 'flex') {
        closePalette();
      }
    });

    commandPaletteInput.addEventListener('input', () => buildPaletteResults(commandPaletteInput.value));
    commandPaletteOverlay.addEventListener('click', (e) => {
      if (e.target === commandPaletteOverlay) {
        closePalette();
      }
    });
  }


  // --- "On this page" Sticky TOC ---
  // This script generates a table of contents based on headings in the article body.
  // It creates a list of links that scroll to the respective headings when clicked.
  const tocContainer = document.getElementById('toc-container');
  const articleBody = document.querySelector('.article-body');

  if (tocContainer && articleBody) {
    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length > 1) {
      const tocList = document.createElement('ul');
      tocList.className = 'toc-list';
      let tocTitle = document.createElement('h3');
      tocTitle.textContent = 'On this page';
      tocContainer.appendChild(tocTitle);
      
      headings.forEach((heading, i) => {
        const id = 'toc-heading-' + i;
        heading.id = id;
        
        const li = document.createElement('li');
        li.className = 'toc-level-' + heading.tagName.toLowerCase().charAt(1);
        
        const a = document.createElement('a');
        a.textContent = heading.textContent;
        a.href = '#' + id;
        
        li.appendChild(a);
        tocList.appendChild(li);
      });
      
      tocContainer.appendChild(tocList);

      const tocLinks = tocContainer.querySelectorAll('a');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const id = entry.target.getAttribute('id');
          const correspondingLink = tocContainer.querySelector(`a[href="#${id}"]`);
          if (correspondingLink) {
            if (entry.isIntersecting) {
              tocLinks.forEach(link => link.classList.remove('is-active'));
              correspondingLink.classList.add('is-active');
            }
          }
        });
      }, { rootMargin: "0px 0px -80% 0px" });

      headings.forEach(heading => observer.observe(heading));
    }
  }

  // --- Image Comparison Slider ---
  // This script allows users to compare two images by sliding a handle.
  // It sets the width of the top image based on the slider handle position.
  document.querySelectorAll('.comparison-slider').forEach(slider => {
    let isDragging = false;
    const handle = slider.querySelector('.slider-handle');
    const topImg = slider.querySelector('.img-top');

    const moveSlider = (e) => {
      if (!isDragging) return;
      const rect = slider.getBoundingClientRect();
      let x = (e.clientX || e.touches[0].clientX) - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percentage = (x / rect.width) * 100;
      topImg.style.width = percentage + '%';
      handle.style.left = percentage + '%';
    };

    handle.addEventListener('mousedown', (e) => { e.preventDefault(); isDragging = true; });
    handle.addEventListener('touchstart', (e) => { e.preventDefault(); isDragging = true; });
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
    document.addEventListener('mousemove', moveSlider);
    document.addEventListener('touchmove', moveSlider);
  });

  // --- Click-to-Zoom Images ---
  // This script allows users to click on images to zoom in.
  // It creates an overlay with the zoomed image and closes it on click.
  if (articleBody) {
    articleBody.querySelectorAll('img').forEach(img => {
      if (!img.closest('a')) { // Don't apply to images that are already links
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.className = 'image-zoom-overlay';
          const zoomedImg = document.createElement('img');
          zoomedImg.src = img.src;
          overlay.appendChild(zoomedImg);
          document.body.appendChild(overlay);

          setTimeout(() => overlay.classList.add('visible'), 10);
          
          overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
          });
        });
      }
    });
  }

  // --- Article Reading Progress Bar ---
  // This script creates a reading progress bar that updates as the user scrolls.
  // It calculates the scroll position and sets the width of the progress bar accordingly.
  const progressBar = document.createElement('div');
  progressBar.id = 'reading-progress-bar';
  document.body.appendChild(progressBar);
  
  const updateProgressBar = () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const progress = (scrollTop / scrollHeight) * 100;
      progressBar.style.width = progress + '%';
    } else {
        progressBar.style.width = '0%';
    }
  };
  
  window.addEventListener('scroll', updateProgressBar);
  
  // --- 8. Interactive Checklists ---
  // This script allows users to check/uncheck items in a checklist.
  // It toggles the 'checked' class on list items when clicked.
  document.querySelectorAll('.interactive-checklist li').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
    });
  });

  // --- Zendesk Garden: Stepper ---
  // This script initializes the stepper component, allowing users to click through steps.
  // It updates the stepper's state based on user interaction.
  document.querySelectorAll('.stepper').forEach(stepper => {
    const steps = stepper.querySelectorAll('.stepper-item');
    steps.forEach((step, index) => {
      step.addEventListener('click', () => {
        steps.forEach((s, i) => {
          s.classList.remove('is-active', 'is-completed');
          if (i < index) {
            s.classList.add('is-completed');
          } else if (i === index) {
            s.classList.add('is-active');
          }
        });
      });
    });
  });

});

// This script enhances the Knowledge Base article experience with various features
// such as custom article layouts, animated details sections, copy-to-clipboard functionality,
// expand/collapse all details, and interactive hotspots.
// It also includes a content drawer for displaying additional information dynamically.
document.addEventListener('DOMContentLoaded', function() {
    // --- Adds a body class for custom article layouts ---
    // This checks if a wrapper with the ID 'kb-article-wrapper' exists
    // and adds a class to the body tag for article-specific styling.
    const kbArticle = document.getElementById('kb-article-wrapper');
    if (kbArticle) {
        document.body.classList.add('kb-article-view');
    }

    // --- Animates <details> elements for smooth open/close ---
    // Finds all <details> elements with the class '.kb-details'
    const allDetails = document.querySelectorAll('.kb-details');
    allDetails.forEach((details) => {
        const summary = details.querySelector('.kb-summary');
        const content = details.querySelector('.kb-details-content');

        if (summary && content) {
            summary.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default toggle
                if (details.open) {
                    const closingAnimation = content.animate({
                        height: [content.offsetHeight + 'px', 0]
                    }, { duration: 200, easing: 'ease-out' });
                    closingAnimation.onfinish = () => {
                        details.removeAttribute('open');
                    };
                } else {
                    details.setAttribute('open', '');
                    content.animate({
                        height: [0, content.offsetHeight + 'px']
                    }, { duration: 200, easing: 'ease-out' });
                }
            });
        }
    });

    // --- Copy-to-Clipboard Snippet Logic ---
    const allCopySnippets = document.querySelectorAll('.kb-copy-snippet');
    allCopySnippets.forEach(snippet => {
        const button = snippet.querySelector('button');
        const textToCopyEl = snippet.querySelector('code');

        if (button && textToCopyEl) {
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(textToCopyEl.innerText).then(() => {
                    const originalText = button.innerHTML;
                    button.innerHTML = 'Copied!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
  const expandBtn = document.getElementById('expandAllDetails');
  const collapseBtn = document.getElementById('collapseAllDetails');
  const allDetails = document.querySelectorAll('.kb-details');

  if (expandBtn && collapseBtn && allDetails.length > 0) {
    expandBtn.addEventListener('click', () => {
      allDetails.forEach(details => details.setAttribute('open', ''));
    });

    collapseBtn.addEventListener('click', () => {
      allDetails.forEach(details => details.removeAttribute('open'));
    });
  }
});

// Hotspots functionality
// This script allows for toggling hotspots on click, and closing them when clicking outside.
document.addEventListener('DOMContentLoaded', function() {
  const allHotspots = document.querySelectorAll('.hotspot');

  allHotspots.forEach(hotspot => {
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevents the click from closing the hotspot immediately

      // If this hotspot is already active, close it. Otherwise, activate it.
      const isActive = hotspot.classList.contains('active');

      // First, close all other hotspots
      allHotspots.forEach(h => h.classList.remove('active'));
      
      // If it wasn't active, make it active now.
      if (!isActive) {
        hotspot.classList.add('active');
      }
    });
  });

  // Add a global click listener to close hotspots when clicking elsewhere
  document.addEventListener('click', (e) => {
    // Check if the click was outside of any hotspot
    if (!e.target.closest('.hotspot')) {
      allHotspots.forEach(h => h.classList.remove('active'));
    }
  });
});

// Content Drawer functionality
// This script handles the opening and closing of a content drawer, fetching content dynamically based on links
// clicked, and displaying it within the drawer.
// It also includes error handling for content loading and allows closing the drawer with a button or by clicking outside the drawer.
document.addEventListener('DOMContentLoaded', function() {
  const drawerOverlay = document.getElementById('contentDrawerOverlay');
  const drawerPanel = document.getElementById('contentDrawerPanel');
  const drawerTitle = document.getElementById('contentDrawerTitle');
  const drawerContent = document.getElementById('contentDrawerContent');
  const drawerCloseBtn = document.getElementById('contentDrawerClose');

  // Ensure drawer elements exist before proceeding
  if (!drawerOverlay || !drawerPanel || !drawerCloseBtn) {
    return;
  }

  // Function to open the drawer
  const openDrawer = () => {
    drawerOverlay.classList.add('is-open');
  };

  // Function to close the drawer
  const closeDrawer = () => {
    drawerOverlay.classList.remove('is-open');
    // Clear content after the animation finishes
    setTimeout(() => {
      drawerTitle.textContent = 'Loading...';
      drawerContent.innerHTML = '';
      drawerContent.classList.remove('is-loading');
    }, 300);
  };

  // Function to fetch and display content
  const loadDrawerContent = async (url, selector) => {
    openDrawer();
    drawerContent.classList.add('is-loading');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      const targetElement = doc.querySelector(selector);
      const articleTitle = doc.querySelector('h1.article-title');

      if (targetElement) {
        drawerTitle.textContent = articleTitle ? articleTitle.innerText.trim() : 'Content';
        drawerContent.innerHTML = targetElement.innerHTML;
      } else {
        drawerTitle.textContent = 'Error';
        drawerContent.innerHTML = `<p>Sorry, the requested content with the selector "<strong>${selector}</strong>" could not be found in the linked article.</p>`;
      }
    } catch (error) {
      console.error('Error fetching drawer content:', error);
      drawerTitle.textContent = 'Error';
      drawerContent.innerHTML = '<p>Sorry, there was an error loading the content.</p>';
    } finally {
      drawerContent.classList.remove('is-loading');
    }
  };

  // Event listener for all clicks on the page (delegation)
  document.body.addEventListener('click', (e) => {
    const drawerLink = e.target.closest('a[data-drawer-content]');
    if (drawerLink) {
      e.preventDefault();
      const url = drawerLink.href;
      const selector = drawerLink.dataset.drawerContent;
      loadDrawerContent(url, selector);
    }
  });

  // Close button functionality
  drawerCloseBtn.addEventListener('click', closeDrawer);

  // Close drawer when clicking on the overlay (but not the panel itself)
  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) {
      closeDrawer();
    }
  });

  // Close drawer with the Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOverlay.classList.contains('is-open')) {
      closeDrawer();
    }
  });
});


// Interactive Comparison Grid functionality
// This script allows users to filter and highlight columns in a comparison grid.
document.addEventListener('DOMContentLoaded', function() {
  // --- Interactive Comparison Grid ---
  const gridContainers = document.querySelectorAll('.comparison-grid-container');

  gridContainers.forEach(container => {
    const filterButtons = container.querySelectorAll('.grid-filter-btn');
    const grid = container.querySelector('.comparison-grid');
    const cells = container.querySelectorAll('.grid-cell');
    
    if (!grid || filterButtons.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const colToHighlight = button.dataset.highlightCol;

        // Update button active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Handle highlighting
        if (colToHighlight === 'all') {
          grid.classList.remove('is-highlighting');
          cells.forEach(cell => {
            cell.classList.remove('is-faded', 'is-highlighted');
          });
        } else {
          grid.classList.add('is-highlighting');
          cells.forEach(cell => {
            cell.classList.remove('is-faded', 'is-highlighted');
            if (cell.classList.contains('col-' + colToHighlight)) {
              cell.classList.add('is-highlighted');
            } else if (!cell.classList.contains('grid-label')) {
              cell.classList.add('is-faded');
            }
          });
        }
      });
    });
  });
});


// Animated Chart Feature
// This script creates an animated bar chart using Chart.js to visualize savings growth over time.
document.addEventListener('DOMContentLoaded', function() {
  // --- Animated Chart Feature ---
  const savingsChartCtx = document.getElementById('savingsGrowthChart');

  // Only run this code if the canvas element with this ID exists on the page
  if (savingsChartCtx) {
    const labels = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const data = {
      labels: labels,
      datasets: [{
        label: 'Total Savings',
        backgroundColor: 'rgba(62, 79, 229, 0.8)', // semi-transparent --percapita-blue
        borderColor: 'rgb(62, 79, 229)',
        borderWidth: 1,
        borderRadius: 4,
        data: [2255, 3568, 4941, 6380, 7888], // Example data
      }]
    };

    const config = {
      type: 'bar', // You can change this to 'line', 'pie', etc.
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false // Hides the legend label at the top
          },
          title: {
            display: true,
            text: 'Savings Balance ($)'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    // Create the chart
    new Chart(savingsChartCtx, config);
  }
});


// Scenario Toggles
// This script handles toggling between different scenarios in a content wrapper.
document.addEventListener('DOMContentLoaded', function() {
  // --- "View As" Scenario Toggles ---
  const allToggleContainers = document.querySelectorAll('.scenario-toggles');

  allToggleContainers.forEach(container => {
    const buttons = container.querySelectorAll('.scenario-btn');
    const contentWrapper = container.nextElementSibling;
    
    if (!contentWrapper || !contentWrapper.classList.contains('scenario-content-wrapper')) {
      console.warn('Scenario Toggles: Could not find a .scenario-content-wrapper next to a toggle container.');
      return;
    }

    const scenarioContents = contentWrapper.querySelectorAll('.scenario-content');

    // Set a default active state on page load (activate the first button and its content)
    if (buttons.length > 0 && scenarioContents.length > 0) {
      buttons[0].classList.add('active');
      const defaultScenario = buttons[0].dataset.scenarioTarget;
      const defaultContent = contentWrapper.querySelector(`.scenario-content[data-scenario="${defaultScenario}"]`);
      if (defaultContent) {
        defaultContent.classList.add('is-active');
      }
    }
    
    container.addEventListener('click', (e) => {
      // Ensure we clicked a scenario button
      if (!e.target.matches('.scenario-btn')) return;

      const button = e.target;
      const targetScenario = button.dataset.scenarioTarget;

      // Update button active states
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update content visibility
      scenarioContents.forEach(content => {
        content.classList.remove('is-active');
        if (content.dataset.scenario === targetScenario) {
          content.classList.add('is-active');
        }
      });
    });
  });
});


// Favorites Toolkit
// This script allows users to favorite articles and manage their favorites list.
document.addEventListener('DOMContentLoaded', function() {
  // --- Favorites Toolkit Logic ---
  const FAVORITES_KEY = 'percapitaKbFavorites';
  const favoritesListContainer = document.getElementById('favorites-list');
  const favoriteBtn = document.querySelector('.favorite-btn');

  const getFavorites = () => {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  };

  const saveFavorites = (favoritesArray) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesArray));
  };

  const renderFavoritesList = () => {
    if (!favoritesListContainer) return;
    
    const favorites = getFavorites();
    favoritesListContainer.innerHTML = ''; // Clear the list

    if (favorites.length === 0) {
      favoritesListContainer.innerHTML = '<li class="no-favorites">You haven\'t favorited any articles yet.</li>';
    } else {
      favorites.forEach(fav => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = fav.url;
        a.textContent = fav.title;
        a.setAttribute('role', 'menuitem');
        li.appendChild(a);
        favoritesListContainer.appendChild(li);
      });
    }
  };

  const setupFavoriteButton = () => {
    if (!favoriteBtn) return;

    const currentUrl = window.location.href;
    const favorites = getFavorites();
    const isAlreadyFavorited = favorites.some(fav => fav.url === currentUrl);

    if (isAlreadyFavorited) {
      favoriteBtn.classList.add('is-favorite');
      favoriteBtn.querySelector('span').textContent = 'Favorited';
    }

    favoriteBtn.addEventListener('click', () => {
      let currentFavorites = getFavorites();
      const articleTitle = document.querySelector('h1.article-title').innerText.trim();
      const articleUrl = window.location.href;
      
      const favoriteIndex = currentFavorites.findIndex(fav => fav.url === articleUrl);

      if (favoriteIndex > -1) {
        // It's already a favorite, so remove it
        currentFavorites.splice(favoriteIndex, 1);
        favoriteBtn.classList.remove('is-favorite');
        favoriteBtn.querySelector('span').textContent = 'Favorite';
      } else {
        // It's not a favorite, so add it
        currentFavorites.push({ title: articleTitle, url: articleUrl });
        favoriteBtn.classList.add('is-favorite');
        favoriteBtn.querySelector('span').textContent = 'Favorited';
      }
      
      saveFavorites(currentFavorites);
      renderFavoritesList(); // Re-render the list immediately
    });
  };

  // Initial setup on page load
  renderFavoritesList();
  setupFavoriteButton();
});


document.addEventListener('DOMContentLoaded', function() {

  // --- Custom Article Layouts ---
  // This script checks if the article wrapper exists and adds a class to the body
  // for custom styling of Knowledge Base articles.
  const kbArticleWrapper = document.getElementById('kb-article-wrapper');
  if (kbArticleWrapper) {
    document.body.classList.add('kb-article-view');
  }

  // --- Animated Collapsible Sections ---
  // This script enhances the <details> elements with a smooth open/close animation.

  const allDetails = document.querySelectorAll('.kb-details');
  allDetails.forEach((details) => {
    const summary = details.querySelector('.kb-summary');
    const content = details.querySelector('.kb-details-content');

    if (summary && content) {
      summary.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default toggle
        if (details.open) {
          const closingAnimation = content.animate({ height: [content.offsetHeight + 'px', 0] }, { duration: 200, easing: 'ease-out' });
          closingAnimation.onfinish = () => { details.removeAttribute('open'); };
        } else {
          details.setAttribute('open', '');
          content.animate({ height: [0, content.offsetHeight + 'px'] }, { duration: 200, easing: 'ease-out' });
        }
      });
    }
  });

  // --- Sticky In-Page Navigation ---
  // This script creates a sticky navigation bar that appears when the user scrolls down the page.
  // It also adds smooth scrolling for anchor links within the sticky nav.
  const stickyNav = document.querySelector('.kb-sticky-nav');
  if (stickyNav) {
    const navOffsetTop = stickyNav.offsetTop;
    const handleScroll = () => {
      if (window.scrollY >= navOffsetTop) {
        stickyNav.classList.add('stuck');
      } else {
        stickyNav.classList.remove('stuck');
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Smooth scroll for anchor links in the sticky nav
    stickyNav.querySelectorAll('a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offsetPosition = targetElement.offsetTop - (stickyNav.offsetHeight + 20);
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      });
    });
  }

  // --- Custom Tabbed Content ---
  // This script initializes tabbed content sections, allowing users to switch between different tabs.
  // It sets the first tab as active by default and handles tab switching.
  const allTabContainers = document.querySelectorAll('.kb-tabs');
  allTabContainers.forEach(tabContainer => {
    const tabs = tabContainer.querySelectorAll('.kb-tab');
    const panels = tabContainer.querySelectorAll('.kb-tab-panel');

    if (tabs.length > 0) {
      // Set default active state
      tabs[0].classList.add('active');
      const defaultPanel = document.getElementById(tabs[0].dataset.tab);
      if (defaultPanel) defaultPanel.classList.add('active');
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        const targetPanel = document.getElementById(targetId);

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  });

  // --- Copy-to-Clipboard Snippets ---
  // This script adds copy-to-clipboard functionality to code snippets.
  // It listens for clicks on buttons within elements with the class '.kb-copy-snippet'.
  const allCopySnippets = document.querySelectorAll('.kb-copy-snippet');
  allCopySnippets.forEach(snippet => {
    const button = snippet.querySelector('button');
    const textToCopyEl = snippet.querySelector('code');

    if (button && textToCopyEl) {
      button.addEventListener('click', () => {
        navigator.clipboard.writeText(textToCopyEl.innerText).then(() => {
          const originalText = button.innerHTML;
          button.innerHTML = 'Copied!';
          button.classList.add('copied');
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      });
    }
  });

});

// --- Accordion Component ---
// This script initializes accordions on the page, allowing users to expand/collapse sections of content.
const accordions = document.querySelectorAll('.accordion');

accordions.forEach(acc => {
    acc.addEventListener('click', function() {
        this.classList.toggle('active');
        const panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    });
});

// --- Custom Video Player ---
const videoContainers = document.querySelectorAll('.kb-video-container');

videoContainers.forEach(container => {
    const playButton = container.querySelector('.kb-video-play-btn');
    const videoUrl = container.dataset.videoSrc; // Get video URL from data attribute
    const playerWrapper = container.querySelector('.kb-video-player');

    if (playButton && videoUrl && playerWrapper) {
        playButton.addEventListener('click', (event) => {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', videoUrl);
            iframe.setAttribute('width', '560');
            iframe.setAttribute('height', '315');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');

            playerWrapper.innerHTML = ''; // Clear the player wrapper
            playerWrapper.appendChild(iframe);
            event.target.style.display = 'none'; // Hide the play button
        });
    }
});