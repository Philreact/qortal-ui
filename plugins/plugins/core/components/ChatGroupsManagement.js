import { LitElement, html, css } from 'lit'
import { render } from 'lit/html.js'
import { Epml } from '../../../epml'
import snackbar from './snackbar.js'
import '@material/mwc-button'
import '@material/mwc-dialog'
import '@polymer/paper-spinner/paper-spinner-lite.js'
import '@material/mwc-icon'
import './WrapperModal'
import '@vaadin/tabs'
import '@vaadin/tabs/theme/material/vaadin-tabs.js'
import '@vaadin/avatar'
import '@vaadin/grid'
import '@vaadin/grid/vaadin-grid-filter-column.js'
import { columnBodyRenderer } from '@vaadin/grid/lit.js'
import { use, get, translate, translateUnsafeHTML, registerTranslateConfig } from 'lit-translate'

const parentEpml = new Epml({ type: 'WINDOW', source: window.parent })

class ChatGroupsManagement extends LitElement {
  static get properties() {
    return {
      isLoading: { type: Boolean },
      isOpenLeaveModal: {type: Boolean},
      leaveGroupObj: { type: Object },
      error: {type: Boolean},
      message: {type: String},
      chatHeads: {type: Array},
      setActiveChatHeadUrl: {attribute: false},
      selectedAddress: {attribute: Object},
      currentTab: {type: Number},
      groups: {type: Array}
    }
  }

  constructor() {
    super();
    this.isLoading = false;
    this.isOpenLeaveModal = false
    this.leaveGroupObj = {}
    this.fee = null
    this.error = false
    this.message = ''
    this.chatHeads = []
    this.currentTab = 0
    this.groups = []
  }

  static get styles() {
    return css`
      .top-bar-icon {
            cursor: pointer;
            height: 18px;
            width: 18px;
            transition: .2s all;
        }
        .top-bar-icon:hover {
            color: var(--black)
        }
        .modal-button {
            font-family: Roboto, sans-serif;
            font-size: 16px;
            color: var(--mdc-theme-primary);
            background-color: transparent;
            padding: 8px 10px;
            border-radius: 5px;
            border: none;
            transition: all 0.3s ease-in-out;
        }
    `
  }

  async getJoinedGroups(){
    let joinedG = await parentEpml.request('apiCall', {
        url: `/groups/member/${this.selectedAddress.address}`
    })
    return joinedG
}

 async firstUpdated() {

    try {
        let _joinedGroups = await this.getJoinedGroups()
        this.joinedGroups = _joinedGroups
    } catch (error) {
        
    }
    
    }

    _tabChanged(e) {
        this.currentTab = e.detail.value
    }

    async unitFee() {
        const myNode = window.parent.reduxStore.getState().app.nodeConfig.knownNodes[window.parent.reduxStore.getState().app.nodeConfig.node]
        const nodeUrl = myNode.protocol + '://' + myNode.domain + ':' + myNode.port
        const url = `${nodeUrl}/transactions/unitfee?txType=LEAVE_GROUP`
        let fee = null

        try {
            const res = await fetch(url)
            const data = await res.json()
            fee = (Number(data) / 1e8).toFixed(3)
        } catch (error) {
            fee = null
        }
  
      return fee
    }

    timeIsoString(timestamp) {
        let myTimestamp = timestamp === undefined ? 1587560082346 : timestamp
        let time = new Date(myTimestamp)
        return time.toISOString()
    }

    resetDefaultSettings() {
        this.error = false
        this.message = ''
        this.isLoading = false
    }

    renderErr9Text() {
        return html`${translate("grouppage.gchange49")}`
    }

    async confirmRelationship() {
		

		let interval = null
		let stop = false
		const getAnswer = async () => {
			const currentChats = this.chatHeads

			if (!stop) {
				stop = true;
				try {
                    const findGroup = currentChats.find((item)=> item.groupId === this.leaveGroupObj.groupId)
					if (!findGroup) {
						clearInterval(interval)
						this.isLoading = false
                        this.isOpenLeaveModal= false
                        this.setActiveChatHeadUrl('')
					}

				} catch (error) {
				}
				stop = false
			}
		};
		interval = setInterval(getAnswer, 5000);
	}

    async _leaveGroup(groupId, groupName) {
        // Reset Default Settings...
        this.resetDefaultSettings()
    
        const leaveFeeInput = await this.unitFee()
        if(!leaveFeeInput){
            throw Error()
        }
        this.isLoading = true

        // Get Last Ref
        const getLastRef = async () => {
            let myRef = await parentEpml.request('apiCall', {
                type: 'api',
                url: `/addresses/lastreference/${this.selectedAddress.address}`
            })
            return myRef
        };

        const validateReceiver = async () => {
            let lastRef = await getLastRef();
            let myTransaction = await makeTransactionRequest(lastRef)
            getTxnRequestResponse(myTransaction)

        }

        // Make Transaction Request
        const makeTransactionRequest = async (lastRef) => {
            let groupdialog3 = get("transactions.groupdialog3")
            let groupdialog4 = get("transactions.groupdialog4")
            let myTxnrequest = await parentEpml.request('transaction', {
                type: 32,
                nonce: this.selectedAddress.nonce,
                params: {
                    fee: leaveFeeInput,
                    registrantAddress: this.selectedAddress.address,
                    rGroupName: groupName,
                    rGroupId: groupId,
                    lastReference: lastRef,
                    groupdialog3: groupdialog3,
                    groupdialog4: groupdialog4,
                }
            })
            return myTxnrequest
        }

        const getTxnRequestResponse = (txnResponse) => {

            if (txnResponse.success === false && txnResponse.message) {
                this.error = true
                this.message = txnResponse.message
                throw new Error(txnResponse)
            } else if (txnResponse.success === true && !txnResponse.data.error) {
                this.message = this.renderErr9Text()
                this.error = false
                this.confirmRelationship()
            } else {
                this.error = true
                this.message = txnResponse.data.message
                throw new Error(txnResponse)
            }
        }
        validateReceiver()
    }

    nameRenderer(person){
        return html`
          <vaadin-horizontal-layout style="align-items: center;display:flex" theme="spacing">
            <vaadin-avatar style="margin-right:5px" img="${person.pictureUrl}" .name="${person.displayName}"></vaadin-avatar>
            <span> ${person.displayName} </span>
          </vaadin-horizontal-layout>
        `;
      };

  render() {
    return html`
         <!-- <vaadin-icon @click=${()=> {
            this.isOpenLeaveModal = true
         }} class="top-bar-icon" style="margin: 0px 20px" icon="vaadin:exit" slot="icon"></vaadin-icon> -->
         <!-- Leave Group Dialog -->
         <wrapper-modal 
                .removeImage=${() => {
                    if(this.isLoading) return
                    this.isOpenLeaveModal = false
                } } 
                customStyle=${"width: 90%; max-width: 900px; height: 90%"}
                style=${(this.isOpenLeaveModal) ? "display: block" : "display: none"}>
             <div style="width: 100%;height: 100%;display: flex; flex-direction: column;background:var(--mdc-theme-surface)">    
                <div style="height: 50px;display: flex; flex:0">
                <vaadin-tabs id="tabs" selected="${this.currentTab}" @selected-changed="${this._tabChanged}" style="width: 100%">
            
                <vaadin-tab>Groups</vaadin-tab>
                <vaadin-tab>Group Join Requests</vaadin-tab>
                <vaadin-tab>Invites</vaadin-tab>
                <vaadin-tab>Blocked Users</vaadin-tab>
</vaadin-tabs>
                </div>
                    
                <div style="width: 100%;display: flex; flex-direction: column; flex-grow: 1; overflow:auto;background:var(--mdc-theme-surface)">
             
                    ${this.currentTab === 0 ? html`
                    <div>
                    

                     <!-- Groups tab -->
                    <!-- Search groups and be able to join -->
                    <p>Search groups</p>
                    <!-- Click group and it goes to that group and open right panel and settings -->
                    <p>Current groups as owner</p>
                    <p>Current groups as member</p>
                    </div>
                    ` : ''}
                   
                   
                </div>
                <div style="width: 100%;height: 50;display: flex; flex: 0">  
                    <button
                    class="modal-button"
                        ?disabled="${this.isLoading}"
                        @click=${() => this._leaveGroup(this.leaveGroupObj.groupId, this.leaveGroupObj.groupName)}
                    >
                    ${translate("grouppage.gchange37")}
                    </button>
                    <button
                    @click=${() => {
                        this.isOpenLeaveModal= false
                    }}
                    class="modal-button"
                        ?disabled="${this.isLoading}"
                    
                    >
                    ${translate("general.close")}
                    </button>
                </div>
                    </div>  
                </wrapper-modal >
    `;
  }
}

customElements.define('chat-groups-management', ChatGroupsManagement);