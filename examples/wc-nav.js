export class WcNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const path = window.location.pathname;
        const isRoot = path.endsWith('index.html') || path.endsWith('/');

        const rootPath = isRoot ? './' : '../';
        const examplesPath = isRoot ? './examples/' : './';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto 20px auto;
                }
                nav {
                    display: flex;
                    gap: 25px;
                    padding: 12px 24px;
                    background: #1e293b;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    align-items: center;
                }
                .logo {
                    font-weight: 800;
                    color: white;
                    font-size: 1.1rem;
                    margin-right: 15px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                a {
                    color: #94a3b8;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    position: relative;
                    padding: 5px 0;
                }
                a:hover {
                    color: white;
                }
                a.active {
                    color: white;
                }
                a.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #3b82f6;
                    border-radius: 2px;
                }
            </style>
            <nav>
                <div class="logo">WC-TABLES</div>
                <a href="${rootPath}index.html" class="${path.endsWith('index.html') ? 'active' : ''}">Main</a>
                <a href="${examplesPath}placeholder.html" class="${path.endsWith('placeholder.html') ? 'active' : ''}">API (Placeholder)</a>
                <a href="${examplesPath}plugins.html" class="${path.endsWith('plugins.html') ? 'active' : ''}">Plugins</a>
                <a href="${examplesPath}menus.html" class="${path.endsWith('menus.html') ? 'active' : ''}">Menus Demo</a>
                <a href="${examplesPath}react.html" class="${path.endsWith('react.html') ? 'active' : ''}">React Demo</a>
            </nav>
        `;
    }
}

customElements.define('wc-nav', WcNav);
