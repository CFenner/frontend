import { mdiClose, mdiCog, mdiPencil } from "@mdi/js";
import type { CSSResultGroup } from "lit";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/ha-dialog-header";
import "../../../../components/ha-icon-button";
import "../../../../components/ha-icon-next";
import "../../../../components/ha-md-dialog";
import "../../../../components/ha-md-list";
import "../../../../components/ha-md-list-item";
import "../../../../components/ha-svg-icon";
import type { HassDialog } from "../../../../dialogs/make-dialog-manager";
import { haStyle, haStyleDialog } from "../../../../resources/styles";
import type { HomeAssistant } from "../../../../types";
import type { NewBackupDialogParams } from "./show-dialog-new-backup";

@customElement("ha-dialog-new-backup")
class DialogNewBackup extends LitElement implements HassDialog {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _opened = false;

  @state() private _params?: NewBackupDialogParams;

  public showDialog(params: NewBackupDialogParams): void {
    this._opened = true;
    this._params = params;
  }

  public closeDialog(): void {
    if (this._params!.cancel) {
      this._params!.cancel();
    }
    if (this._opened) {
      fireEvent(this, "dialog-closed", { dialog: this.localName });
    }
    this._opened = false;
    this._params = undefined;
  }

  protected render() {
    if (!this._opened || !this._params) {
      return nothing;
    }

    return html`
      <ha-md-dialog open @closed=${this.closeDialog}>
        <ha-dialog-header slot="headline">
          <ha-icon-button
            slot="navigationIcon"
            @click=${this.closeDialog}
            .label=${this.hass.localize("ui.common.close")}
            .path=${mdiClose}
          ></ha-icon-button>
          <span slot="title">Backup now</span>
        </ha-dialog-header>
        <div slot="content">
          <ha-md-list
            innerRole="listbox"
            itemRoles="option"
            innerAriaLabel="Backup options"
            rootTabbable
            dialogInitialFocus
          >
            <ha-md-list-item
              @click=${this._default}
              type="button"
              .disabled=${!this._params.config.create_backup.password}
            >
              <ha-svg-icon slot="start" .path=${mdiCog}></ha-svg-icon>
              <span slot="headline">My default backup</span>
              <span slot="supporting-text">
                Create a backup with the data and locations you have configured.
              </span>
              <ha-icon-next slot="end"></ha-icon-next>
            </ha-md-list-item>
            <ha-md-list-item @click=${this._custom} type="button">
              <ha-svg-icon slot="start" .path=${mdiPencil}></ha-svg-icon>
              <span slot="headline">Custom backup</span>
              <span slot="supporting-text">
                Select specific data and locations for a custom backup.
              </span>
              <ha-icon-next slot="end"></ha-icon-next>
            </ha-md-list-item>
          </ha-md-list>
        </div>
      </ha-md-dialog>
    `;
  }

  private async _custom() {
    this._params!.submit?.("custom");
    this.closeDialog();
  }

  private async _default() {
    this._params!.submit?.("default");
    this.closeDialog();
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      haStyleDialog,
      css`
        ha-md-dialog {
          --dialog-content-padding: 0;
          max-width: 500px;
        }
        div[slot="content"] {
          margin-top: -16px;
        }
        @media all and (max-width: 450px), all and (max-height: 500px) {
          ha-md-dialog {
            max-width: none;
          }
          div[slot="content"] {
            margin-top: 0;
          }
        }

        ha-md-list {
          background: none;
        }
        ha-md-list-item {
        }
        ha-icon-next {
          width: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-dialog-new-backup": DialogNewBackup;
  }
}
