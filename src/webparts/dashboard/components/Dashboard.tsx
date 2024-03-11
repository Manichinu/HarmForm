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


var NewWeb: any;


export interface FormState {
  Dashboard: boolean;
  NewForm: boolean;
  CurrentUserName: string;
  CurrentUserID: number;
  CurrentUserProfilePic: string;
}

export default class Dashboard extends React.Component<IDashboardProps, FormState, {}> {
  public constructor(props: IDashboardProps, state: FormState) {
    super(props);
    this.state = {
      Dashboard: true,
      NewForm: false,
      CurrentUserName: "",
      CurrentUserID: 0,
      CurrentUserProfilePic: ""

    }
    NewWeb = Web("" + this.props.siteurl + "")

    SPComponentLoader.loadCss(`https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css`);
    SPComponentLoader.loadCss(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`);
    SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/style.css?v=2.9`);
    SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/mediastyle.css?v=2.9`);
  }
  public componentDidMount() {
    this.GetCurrentUserDetails()
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
      NewForm: true
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
                    <h2> Dashboard </h2>
                    <ul className="req_info_btn">
                      <li onClick={() => this.showNewForm()}> <a href="#"> Requestor Information </a></li>
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
                                <h3> 231 </h3>
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
                                <h3> 05 </h3>
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
                                <h3> 02 </h3>
                                <p> Total Rejected </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="table-wrap">
                        <div className="table-search-wrap clearfix">
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
                        </div>
                        <div className="table-responsive">
                          <table className="table etcc_dash_table">
                            <thead>
                              <tr>
                                <th className="s_no  text-center"> # </th>
                                <th className="req_id"> Request id </th>
                                <th className="entity_name"> Entity Name </th>
                                <th className="emp_position"> Employee Position </th>
                                <th className="date_req"> Date of request </th>
                                <th className="type_info"> Type of information </th>
                                <th className="text-center status"> Status  </th>
                                <th className="text-center action_th"> Action  </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="text-center"> 1</td>
                                <td> RQ2425 </td>
                                <td> Lorem Ipsum </td>
                                <td> Lorem Ipsum </td>
                                <td> 11 Mar 2023 </td>
                                <td> Lorem Ipsum </td>
                                <td className="status approved text-center">  <span> Approved  </span> </td>
                                <td className="text-center"> <a href="#"> <img className="view_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/view.svg`} alt="image" /> </a> </td>
                              </tr>
                              <tr>
                                <td className="text-center"> 2 </td>
                                <td> RQ2425 </td>
                                <td> Lorem Ipsum </td>
                                <td> Lorem Ipsum </td>
                                <td> 10 Mar 2023 </td>
                                <td> Lorem Ipsum </td>
                                <td className="status pending text-center">  <span> Pending  </span> </td>
                                <td className="text-center"> <a href="#"> <img className="view_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/view.svg`} alt="image" /> </a> </td>
                              </tr>
                              <tr>
                                <td className="text-center"> 3 </td>
                                <td> RQ2425 </td>
                                <td> Lorem Ipsum </td>
                                <td> Lorem Ipsum </td>
                                <td> 9 Mar 2023 </td>
                                <td> Lorem Ipsum </td>
                                <td className="status pending text-center">  <span> Pending  </span> </td>
                                <td className="text-center"> <a href="#"> <img className="view_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/view.svg`} alt="image" /> </a> </td>
                              </tr>
                              <tr>
                                <td className="text-center"> 4 </td>
                                <td> RQ2425 </td>
                                <td> Lorem Ipsum </td>
                                <td> Lorem Ipsum </td>
                                <td> 6 Mar 2023 </td>
                                <td> Lorem Ipsum </td>
                                <td className="status approved text-center">  <span> Approved  </span> </td>
                                <td className="text-center"> <a href="#"> <img className="view_img" src={`${this.props.siteurl}/SiteAssets/HarmForm/img/view.svg`} alt="image" /> </a> </td>
                              </tr>

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
          <NewForm siteurl={this.props.siteurl} />
        }

      </>
    );
  }
}
