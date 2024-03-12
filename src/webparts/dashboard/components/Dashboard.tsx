import * as React from 'react';
// import styles from './Dashboard.module.scss';
import type { IDashboardProps } from './IDashboardProps';
// import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from "@microsoft/sp-loader";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import "@pnp/sp/attachments";
import "@pnp/sp/presets/all";
import { Web } from "@pnp/sp/webs";
import NewForm from './NewForm';
import 'datatables.net';
import 'datatables.net-responsive';
import 'datatables.net-buttons';
// import 'datatables.net-buttons/js/buttons.colVis.min';
// import 'datatables.net-buttons/js/dataTables.buttons.min';
// import 'datatables.net-buttons/js/buttons.flash.min';
// import 'datatables.net-buttons/js/buttons.html5.min';
// import "datatables.net-dt/css/jquery.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import * as $ from "jquery";
import ViewForm from './ViewForm';


var NewWeb: any;


export interface FormState {
  Dashboard: boolean;
  NewForm: boolean;
  CurrentUserName: string;
  CurrentUserID: number;
  CurrentUserProfilePic: string;
  DataTableItems: any[];
  ApprovedStatusCount: number;
  PendingStatusCount: number;
  RejectedStatusCount: number;
  ItemID: any;
  ViewForm: boolean;
}

export default class Dashboard extends React.Component<IDashboardProps, FormState, {}> {
  public constructor(props: IDashboardProps, state: FormState) {
    super(props);
    this.state = {
      Dashboard: true,
      NewForm: false,
      CurrentUserName: "",
      CurrentUserID: 0,
      CurrentUserProfilePic: "",
      DataTableItems: [],
      ApprovedStatusCount: 0,
      PendingStatusCount: 0,
      RejectedStatusCount: 0,
      ItemID: "",
      ViewForm: false
    }
    NewWeb = Web("" + this.props.siteurl + "")

    SPComponentLoader.loadCss(`https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css`);
    SPComponentLoader.loadCss(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`);
    SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/style.css?v=2.9`);
    SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/mediastyle.css?v=2.9`);
  }
  public componentDidMount() {
    const searchParams = new URLSearchParams(window.location.search);
    const hasSessionID = searchParams.has("RequestId");
    if (hasSessionID) {
      this.setState({
        Dashboard: false,
        NewForm: false,
        ViewForm: true
      })
    }
    this.GetCurrentUserDetails()
    this.getTableItems()
  }
  public async GetCurrentUserDetails() {
    await NewWeb.currentUser.get().then((user: any) => {
      console.log("UserDetails", user);
      this.setState({
        CurrentUserName: user.Title,
        CurrentUserID: user.Id,
        CurrentUserProfilePic: `${this.props.siteurl}/_layouts/15/userphoto.aspx?size=L&username=${user.Email}`

      })
    }, (errorResponse: any) => {
    }
    );

  }
  public showNewForm() {
    this.setState({
      Dashboard: false,
      NewForm: true,
      ViewForm: false
    })
  }
  public async getTableItems() {
    var PendingStatus = 0;
    var ApprovedStatus = 0;
    var RejectedStatus = 0;
    try {
      await NewWeb.lists.getByTitle("HarmForm Transaction").items
        .orderBy("Created", false)
        .getAll()
        .then((items: any) => {
          const sortedItems: any = items.sort((a: any, b: any) => {
            const dateA: any = new Date(a.Created);
            const dateB: any = new Date(b.Created);
            return dateB - dateA;
          });
          for (let i = 0; i < items.length; i++) {
            if (items[i].Status == "Pending") {
              PendingStatus = PendingStatus + 1;
            }
            else if (items[i].Status == "Approved") {
              ApprovedStatus = ApprovedStatus + 1;
            }
            else if (items[i].Status == "Rejected") {
              RejectedStatus = RejectedStatus + 1;
            }
          }
          this.setState({
            DataTableItems: sortedItems,
            PendingStatusCount: PendingStatus,
            ApprovedStatusCount: ApprovedStatus,
            RejectedStatusCount: RejectedStatus
          })
        }).then(() => {
          // $('#table-items').DataTable({
          //   dom: 'Bfrtip',
          //   pageLength: 10,
          //   buttons: [

          //     {
          //       exportOptions: {
          //         columns: [0, 1, 2, 3, 4, 5, 6, 7]
          //       }
          //     },
          //   ]
          // });
          this.loadDataTable()
        });
    } catch (err) {
      console.log("HarmForm Transaction : " + err);
    }
  }
  public loadDataTable() {
    $.fn.dataTable.ext.errMode = "none";

    $("#table-items").DataTable({
      ordering: false,
      pageLength: 5,
      lengthMenu: [
        [5, 10, 20, 50, 100, -1],
        [5, 10, 20, 50, 100, "All"],
      ],
      dom: "Blfrtip",
      // buttons: [
      //   {
      //     extend: "csvHtml5",
      //     text: "Export to Excel",
      //     header: true,
      //     init: function (dt, node, config) {
      //       // Add icon and tooltip to the button
      //       $(node)

      //         .addClass("btn-excel")
      //         .html('<span>Export to </span> <img src="https://etccgov.sharepoint.com/sites/MOURequest/SiteAssets/ETCC/IMAGES/img/excel.svg" alt="Excel">')
      //         .attr("title", "Export to CSV");
      //     },
      //     exportOptions: {
      //       columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      //     },
      //   },
      // ],
    });
  }
  public editItem(id: number) {
    this.setState({
      ItemID: id,
      Dashboard: false,
      NewForm: false,
      ViewForm: true
    })
  }
  public render(): React.ReactElement<IDashboardProps> {
    // const {
    //   description,
    //   isDarkTheme,
    //   environmentMessage,
    //   hasTeamsContext,
    //   userDisplayName
    // } = this.props;
    var handler = this;
    const TableItems = this.state.DataTableItems.map((item, key) => {
      return (
        <tr>
          <td className="text-center">{key + 1}</td>
          <td> {item.RequestID}</td>
          <td> {item.InvolvedDepartment} </td>
          <td> {item.Location}</td>
          <td> {item.LevelofHarm} </td>
          <td> {item.Status}</td>
          <td className="text-center"> <a href="#"> <img onClick={() => handler.editItem(item.RequestID)} className="view_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/view.svg`} alt="image" /> </a> </td>
        </tr>
      )
    })

    return (
      <>
        {this.state.Dashboard == true &&
          <>
            <header>
              <div className="container clearfix">
                <div className="logo">
                  <a href="#"> <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/logo.svg`} alt="image" /> </a>
                </div>
                <div className="notification-part">
                  <ul>
                    <li> <a href="#"> <img className="user_img" src={this.state.CurrentUserProfilePic} alt="image" /> </a> </li>
                    <li> <span> {this.state.CurrentUserName} </span> </li>
                    <li className="relative"> <a href="#"> <img className="next_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/dropdown.svg`} alt="image" /> </a>
                      <div className="logout"> <a href="#"> Logout </a></div>
                    </li>
                  </ul>
                </div>
              </div>
            </header>
            <section>
              <div className="container">
                <div className="dashboard-wrap">
                  <div className="heading-block clearfix">
                    <h2> Classification and Level of Harm Dashboard </h2>
                    <ul className="req_info_btn">
                      <li onClick={() => this.showNewForm()}> <a href="#"> Create Incident Classification </a></li>
                    </ul>
                  </div>

                  <div className="tab-content">
                    <div id="home" className="tab-pane fade in active">
                      <div className="three-blocks-wrap">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="three-blocks">
                              <div className="three-blocks-img">
                                <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/Approved.svg`} alt="image" />
                              </div>
                              <div className="three-blocks-desc">
                                <h3> {this.state.ApprovedStatusCount} </h3>
                                <p> Total Approved </p>
                              </div>

                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="three-blocks">
                              <div className="three-blocks-img">
                                <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/pending.svg`} alt="image" />
                              </div>
                              <div className="three-blocks-desc">
                                <h3> {this.state.PendingStatusCount} </h3>
                                <p> Total Pending </p>
                              </div>

                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="three-blocks">
                              <div className="three-blocks-img">
                                <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/rejected.svg`} alt="image" />
                              </div>
                              <div className="three-blocks-desc">
                                <h3>{this.state.RejectedStatusCount} </h3>
                                <p> Total Rejected </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="table-wrap">
                        {/*  <div className="table-search-wrap clearfix">
                             <div className="table-search relative">
                            <input type="text" placeholder="Search" className="" />
                            <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/search (6).svg`} alt="image" />
                          </div>
                           <div className="table-sort">
                            <ul>
                              <li> <span> Export to </span> <a href="#"> <img className="excel_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/excel.svg`} /> </a></li>
                              <li> <span> Sort By </span>
                                <select name="sort_by" id="sort_by">
                                  <option value="new"> New </option>
                                </select>
                              </li>
                            </ul>
                          </div> 
                        </div>   */}
                        <div className="table-responsive">
                          <table className="table etcc_dash_table" id='table-items'>
                            <thead>
                              <tr>
                                <th className="s_no  text-center">S.No</th>
                                <th className="req_id"> Request Id </th>
                                <th className="entity_name">Involved Department</th>
                                <th className="emp_position">Location</th>
                                <th className="date_req">Level of Harm</th>
                                <th className="text-center status"> Status  </th>
                                <th className="text-center action_th"> Action  </th>
                              </tr>
                            </thead>
                            <tbody>
                              {TableItems}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        }
        {this.state.NewForm == true &&
          <NewForm siteurl={this.props.siteurl} itemId={0} />
        }
        {this.state.ViewForm == true &&
          <ViewForm siteurl={this.props.siteurl} itemId={this.state.ItemID} />
        }
      </>
    );
  }
}
