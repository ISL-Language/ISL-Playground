class PopupInfo extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
  }

  connectedCallback() {
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "closed" });

    // Create spans
    const wrapper = document.createElement("span");
    wrapper.setAttribute("class", "wrapper");

    const icon = document.createElement("span");
    icon.setAttribute("class", "icon");
    icon.setAttribute("tabindex", 0);

    const info = document.createElement("span");
    info.setAttribute("class", "info");

    // Take attribute content and put it inside the info span
    const text = this.getAttribute("content");
    info.innerHTML = text;

    // Insert icon
    if (this.hasAttribute("img")) {
      const img = document.createElement("img");
      img.src = this.getAttribute("img");
      icon.appendChild(img);
    } else if (this.hasAttribute("txt")) {
      const txt = document.createElement("span");
      txt.textContent = this.getAttribute("txt");
      icon.appendChild(txt);
    } else {
      const txt = document.createElement("span");
      txt.textContent = "🛈";
      icon.appendChild(txt);
    }

    // Create some CSS to apply to the shadow dom
    const style = document.createElement("style");

    style.textContent = `

      .wrapper {
        position: relative;
      }

      .info {
        font-size: 0.8rem;
        pointer-events: none;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        color: black;
        border-radius: 10px;
        opacity: 0;
        transition: 0.2s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }

      p, img {
        width: 1.2rem;
      }

      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
        pointer-events: all;
      }

      ::selection {
        background: #9d9d9d4a;
      }
      .container::selection {
        background: #4747474a;
      }
    `;

    

    // Attach the created elements to the shadow dom
    shadow.appendChild(style);

    //Extra stylesheet
    if (this.hasAttribute("copy-style-from")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = this.getAttribute("copy-style-from");
      shadow.appendChild(link)
    }

    shadow.appendChild(wrapper);
    wrapper.appendChild(icon);
    wrapper.appendChild(info);
  }
}

customElements.define("popup-info", PopupInfo);
