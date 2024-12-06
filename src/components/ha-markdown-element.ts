import { ReactiveElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { renderMarkdown } from "../resources/render-markdown";

const _gitHubMarkdownAlerts = {
  reType:
    /(?<input>(\[!(?<type>caution|important|note|tip|warning)\])(?:\s|\\n)?)/i,
  typeToHaAlert: {
    caution: "error",
    important: "info",
    note: "info",
    tip: "success",
    warning: "warning",
  },
};

@customElement("ha-markdown-element")
class HaMarkdownElement extends ReactiveElement {
  @property() public content?;

  @property({ attribute: false, type: Boolean }) public allowSvg = false;

  @property({ type: Boolean }) public breaks = false;

  @property({ type: Boolean, attribute: "lazy-images" }) public lazyImages =
    false;

  protected createRenderRoot() {
    return this;
  }

  protected update(changedProps) {
    super.update(changedProps);
    if (this.content !== undefined) {
      this._render();
    }
  }

  private async _render() {
    this.innerHTML = await renderMarkdown(
      String(this.content),
      {
        breaks: this.breaks,
        gfm: true,
      },
      {
        allowSvg: this.allowSvg,
      }
    );

    this._resize();

    const walker = document.createTreeWalker(
      this,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;

      // Open external links in a new window
      if (
        node instanceof HTMLAnchorElement &&
        node.host !== document.location.host
      ) {
        node.target = "_blank";

        // protect referrer on external links and deny window.opener access for security reasons
        // (see https://mathiasbynens.github.io/rel-noopener/)
        node.rel = "noreferrer noopener";

        // Fire a resize event when images loaded to notify content resized
      } else if (node instanceof HTMLImageElement) {
        if (this.lazyImages) {
          node.loading = "lazy";
        }
        node.addEventListener("load", this._resize);
      } else if (node instanceof HTMLQuoteElement) {
        /**
         * Map GitHub blockquote elements to our ha-alert element
         * https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
         */
        const gitHubAlertMatch =
          node.firstElementChild?.firstChild?.textContent &&
          _gitHubMarkdownAlerts.reType.exec(
            node.firstElementChild.firstChild.textContent
          );

        if (gitHubAlertMatch) {
          const { type: alertType } = gitHubAlertMatch.groups!;
          const haAlertNode = document.createElement("ha-alert");
          haAlertNode.alertType =
            _gitHubMarkdownAlerts.typeToHaAlert[alertType.toLowerCase()];

          haAlertNode.append(
            ...Array.from(node.childNodes)
              .map((child) => {
                const arr = Array.from(child.childNodes);
                if (!this.breaks && arr.length) {
                  // When we are not breaking, the first line of the blockquote is not considered,
                  // so we need to adjust the first child text content
                  const firstChild = arr[0];
                  if (
                    firstChild.nodeType === Node.TEXT_NODE &&
                    firstChild.textContent === gitHubAlertMatch.input &&
                    firstChild.textContent?.includes("\n")
                  ) {
                    firstChild.textContent = firstChild.textContent
                      .split("\n")
                      .slice(1)
                      .join("\n");
                  }
                }
                return arr;
              })
              .reduce((acc, val) => acc.concat(val), [])
              .filter(
                (childNode) =>
                  childNode.textContent &&
                  childNode.textContent !== gitHubAlertMatch.input
              )
          );
          walker.parentNode()!.replaceChild(haAlertNode, node);
        }
      } else if (
        node instanceof HTMLElement &&
        ["ha-alert", "ha-qr-code", "ha-icon", "ha-svg-icon"].includes(
          node.localName
        )
      ) {
        import(
          /* webpackInclude: /(ha-alert)|(ha-qr-code)|(ha-icon)|(ha-svg-icon)/ */ `./${node.localName}`
        );
      }
    }
  }

  private _resize = () => fireEvent(this, "content-resize");
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-markdown-element": HaMarkdownElement;
  }
}
