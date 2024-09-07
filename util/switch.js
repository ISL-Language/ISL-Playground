class SwitchInputElement extends HTMLElement {
  static observedAttributes = ["round"]
  /** @type {HTMLInputElement} */
  #control = null
  /** @type {HTMLLabelElement} */
  #slider = null
  constructor() {
    // Always call super first in constructor
    super();
  }

  //Form API
  get checked(){
    return this.#control.checked
  }
  set checked(v){
    this.#control.checked = v
  }
  get name(){
    return this.#control.name
  }
  set name(v){
    this.#control.name = v
  }
  get disabled(){
    return this.#control.disabled
  }
  set disabled(v){
    this.#control.disabled = v
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(name === "round") {
      if(newValue === null){
        if(this.#slider.classList.contains("round")){
          this.#slider.classList.remove("round")
        }
      }
      else{
        if(!this.#slider.classList.contains("round")){
          this.#slider.classList.add("round")
        }
      }
    }
  }

  connectedCallback() {
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "closed" });

    //create switch
    const label = document.createElement("label");
    label.setAttribute("class", "switch")
    const slider = document.createElement("span")
    slider.setAttribute("class", "slider")
    const input = document.createElement("input")
    input.type = "checkbox"
    this.#control = input
    this.#slider = slider
    if(this.hasAttribute("round")){
      slider.classList.add("round")
    }


    // Create some CSS to apply to the shadow dom
    const style = document.createElement("style");

    style.textContent = `
      /* The switch - the box around the slider */
      .switch {
        translate: 0px 3px;
        position: relative;
        display: inline-block;
        width: 30px;
        height: 17px;
      }

      /* Hide default HTML checkbox */
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      /* The slider */
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .3s;
        transition: .3s;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 13px;
        width: 13px;
        left: 2.25px;
        bottom: 2.25px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
      }

      input:checked + .slider {
        background-color: #f32121;
      }

      input:focus + .slider {
        box-shadow: 0 0 2px #f32121;
      }

      input:hover + .slider {
        box-shadow: 0 0 1px #f32121;
      }

      input:checked + .slider:before {
        -webkit-transform: translateX(13px);
        -ms-transform: translateX(13px);
        transform: translateX(13px);
      }

      /* Rounded sliders */
      .slider.round {
        border-radius: 17px;
      }

      .slider.round:before {
        border-radius: 50%;
      }
    `;

    // Attach the created elements to the shadow dom
    shadow.appendChild(label);
    shadow.appendChild(style)
    label.appendChild(input);
    label.appendChild(slider);
  }
}

customElements.define("switch-input", SwitchInputElement);
