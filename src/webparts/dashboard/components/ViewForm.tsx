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
import Dashboard from './Dashboard';
// import Select from "react-dropdown-select";
import * as $ from "jquery";
import swal from "sweetalert";
import * as moment from "moment";



var NewWeb: any;
var RequestID: any;
var SessionID: any;
var ItemStatus: any
export interface FormState {
    Dashboard: boolean;
    ViewForm: boolean;
    CurrentUserName: string;
    CurrentUserID: number;
    CurrentUserProfilePic: string;
    Departments: any[];
    setSelectedDepartment: any[];
    Approvers: any[];
    LevelofHarm: string;
    isAnonymous: boolean;
    WFDetails: any[];
    CurrentStatus: string;
    DepartmentOptions: any[];

}

export default class ViewForm extends React.Component<IDashboardProps, FormState, {}> {
    public constructor(props: IDashboardProps, state: FormState) {
        super(props);
        this.state = {
            Dashboard: false,
            ViewForm: true,
            CurrentUserName: "",
            CurrentUserID: 0,
            CurrentUserProfilePic: "",
            Departments: [],
            setSelectedDepartment: [],
            Approvers: [],
            LevelofHarm: "",
            isAnonymous: false,
            WFDetails: [],
            CurrentStatus: "",
            DepartmentOptions: []
        }
        NewWeb = Web("" + this.props.siteurl + "")
        SessionID = this.props.itemId;

        SPComponentLoader.loadCss(`https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css`);
        SPComponentLoader.loadCss(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`);
        SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/style.css?v=2.9`);
        SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/mediastyle.css?v=2.9`);
    }
    public componentDidMount() {
        const searchParams = new URLSearchParams(window.location.search);
        const hasSessionID = searchParams.has("RequestId");
        if (hasSessionID) {
            SessionID = searchParams.get("RequestId");
        }
        this.GetCurrentUserDetails()
        this.getDepartments()
    }
    public async GetCurrentUserDetails() {
        await NewWeb.currentUser.get().then((user: any) => {
            console.log("UserDetails", user);
            this.setState({
                CurrentUserName: user.Title,
                CurrentUserID: user.Id,
                CurrentUserProfilePic: `${this.props.siteurl}/_layouts/15/userphoto.aspx?size=L&username=${user.Email}`

            })
            setTimeout(() => {
                this.getItem()
                this.getWFHistoryDetails()
                $("input").prop("disabled", true);
                $("textarea").prop("disabled", true);
                $("select").prop("disabled", true)
            }, 200)
        }, (errorResponse: any) => {
        }
        );

    }
    public async getItem() {
        try {
            await NewWeb.lists.getByTitle("HarmForm Transaction").items.select("*")
                .filter(`RequestID eq '${SessionID}'`)
                .get()
                .then((items: any) => {
                    console.log(items)
                    $("#location").val(items[0].Location)
                    $("#incident").val(items[0].DateofIncident)
                    $("#date_quality").val(items[0].DateReportedtoQuality)
                    $("#reporter_name").val(items[0].ReporterName)
                    $("#Communication").val(items[0].Communication)
                    $("#Education").val(items[0].Education)
                    $("#Environment").val(items[0].Environment)
                    $("#Technology").val(items[0].Technology)
                    $("#Procedures").val(items[0].Procedures)
                    $("#department_name").val(items[0].InvolvedDepartment)
                    $("input[value='" + items[0].LevelofHarm + "']").prop('checked', true);
                    items[0].Anonymous == true ? $('#anonymous_yes').prop('checked', true) : $('#anonymous_no').prop('checked', true);
                    RequestID = items[0].RequestID;
                    ItemStatus = items[0].Status
                    this.setState({ CurrentStatus: ItemStatus })
                    const updatedSelectedDepartment = [{ id: items[0].InvolvedDepartment, Title: items[0].InvolvedDepartment }];
                    this.setState({
                        setSelectedDepartment: updatedSelectedDepartment,
                    });
                    if (items[0].Anonymous == true) {
                        $("#reporter-section").show()
                    }
                });
        } catch (err) {
            console.log("HarmForm Transaction : " + err);
        }
    }
    public async getWFHistoryDetails() {
        try {
            await NewWeb.lists.getByTitle("HarmForm WF History").items.select("*", "AssignedTo/Title")
                .expand("AssignedTo/Title")
                .filter(`RequestID eq '${SessionID}'`)
                .get()
                .then((items: any) => {
                    console.log("WF", items)
                    this.setState({
                        WFDetails: items
                    })
                });
        } catch (err) {
            console.log("HarmForm WF History: " + err);
        }
    }
    public async getDepartments() {
        try {
            await NewWeb.lists.getByTitle("Department Master").items.select("*")
                .get()
                .then((items: any) => {
                    var Department = []
                    if (items.length != 0) {
                        for (var i = 0; i < items.length; i++) {
                            Department.push({ value: items[i].Title, label: items[i].Title })
                        }
                        this.setState({
                            Departments: Department,
                            DepartmentOptions: items
                        });
                    }
                });
        } catch (err) {
            console.log("Department Master : " + err);
        }
    }
    public handleDepartmentChange = (selectedOptions: any[]) => {
        // Transform selectedOptions into the format you need
        const updatedSelectedDepartment = selectedOptions.map((option: { value: any; label: any; }) => ({
            id: option.value,
            Title: option.label,
        }));
        this.setState({
            setSelectedDepartment: updatedSelectedDepartment,
        });

    };
    public anonymousTrue() {
        $("#reporter-section").show()
        this.setState({ isAnonymous: true })
    }
    public anonymousFalse() {
        $("#reporter-section").hide()
        this.setState({ isAnonymous: false })
    }
    public async Approved() {
        var TransactionID = await NewWeb.lists.getByTitle("HarmForm Transaction").items.select("*")
            .filter(`RequestID eq '${SessionID}'`)
            .get()
            .then((items: any) => {
                return items[0].ID
            })
        var WFID = await NewWeb.lists.getByTitle("HarmForm WF History").items.select("*")
            .filter(`RequestID eq '${SessionID}'`)
            .get()
            .then((items: any) => {
                return items[0].ID
            })
        NewWeb.lists.getByTitle("HarmForm Transaction").items.getById(TransactionID).update({
            Status: "Approved"
        }).then(() => {
            NewWeb.lists.getByTitle("HarmForm WF History").items.getById(WFID).update({
                Status: "Approved",
                ActionTakenOn: moment().format("DD-MM-YYYY hh:mm A")
            })
        }).then(() => {
            swal({
                text: "Approved successfully!",
                icon: "success",
            }).then(() => {
                window.open("https://remodigital.sharepoint.com/sites/Remo/RemoSolutions/DigitalForms/POC/SitePages/HarmForm.aspx?env=WebView", "_self")
            })
        })


    }
    public async Rejected() {
        var TransactionID = await NewWeb.lists.getByTitle("HarmForm Transaction").items.select("*")
            .filter(`RequestID eq '${SessionID}'`)
            .get()
            .then((items: any) => {
                return items[0].ID
            })
        var WFID = await NewWeb.lists.getByTitle("HarmForm WF History").items.select("*")
            .filter(`RequestID eq '${SessionID}'`)
            .get()
            .then((items: any) => {
                return items[0].ID
            })
        NewWeb.lists.getByTitle("HarmForm Transaction").items.getById(TransactionID).update({
            Status: "Rejected"
        }).then(() => {
            NewWeb.lists.getByTitle("HarmForm WF History").items.getById(WFID).update({
                Status: "Rejected",
                ActionTakenOn: moment().format("DD-MM-YYYY hh:mm A")
            })
        }).then(() => {
            swal({
                text: "Rejected successfully!",
                icon: "success",
            }).then(() => {
                window.open("https://remodigital.sharepoint.com/sites/Remo/RemoSolutions/DigitalForms/POC/SitePages/HarmForm.aspx?env=WebView", "_self")
            })
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
                {this.state.ViewForm == true &&
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
                                <div className="dashboard-wrap-create view_form_etcc">
                                    <div className="create-heading-block clearfix">
                                        <a href="https://remodigital.sharepoint.com/sites/Remo/RemoSolutions/DigitalForms/POC/SitePages/HarmForm.aspx?env=WebView"> <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/next.svg`} />
                                            <span> Incident Classification Form </span> </a>
                                        <ul>
                                            <li className="number"> {RequestID} </li>
                                            <li className={this.state.CurrentStatus == "Pending" ? "sts-Pending" : this.state.CurrentStatus == "Approved" ? "sts-Approved" : this.state.CurrentStatus == "Rejected" ? "sts-Rejected" : ""}><span> {ItemStatus}</span> </li>
                                        </ul>
                                    </div>
                                    <div className="create_banner">
                                        <div className="create_details">
                                            <h2> Details of Incident Classification</h2>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <label> Location </label>
                                                    <input autoComplete='off' type="text" id="location" className="form-control" placeholder="Enter location" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label>Date of Incident</label>
                                                    <input type="datetime-local" id="incident" className="form-control" placeholder="Enter loaction" />

                                                </div>
                                                <div className="col-md-3">
                                                    <label> Date Reported to Quality </label>
                                                    <input type="datetime-local" id="date_quality" className="form-control" placeholder="Enter loaction" />
                                                </div>
                                                <div className="col-md-3 level-of-harm-wrapper">
                                                    <label> Anonymous </label>
                                                    <div className='anonymous-section'>
                                                        <div className='self-section' onClick={() => this.anonymousTrue()}>
                                                            <input type="radio" id='anonymous_yes' value="self" name="anonymous" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='anonymous_yes'>Yes</label>
                                                        </div>
                                                        <div className='Other-section' onClick={() => this.anonymousFalse()} >
                                                            <input type="radio" value="other" id='anonymous_no' name="anonymous" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='anonymous_no'>No</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <label>Involved Department</label>
                                                    {/* <Select onChange={this.handleDepartmentChange} options={this.state.Departments}
                                                        values={this.state.setSelectedDepartment} /> */}
                                                    <select className='form-control' id='department_name'>
                                                        <option>--Select--</option>
                                                        {this.state.DepartmentOptions.map((item) => {
                                                            return (
                                                                <option value={item.Title}>{item.Title}</option>
                                                            )
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="col-md-6 level-of-harm-wrapper">
                                                    <label>Level of Harm</label>
                                                    <div className='levelofharm-section'>
                                                        <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Reportable circumstances" })}>
                                                            <input type="radio" id='Reportable' value="Reportable circumstances" name="harm" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='Reportable'>Reportable circumstances</label>
                                                        </div>
                                                        <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Near miss" })}>
                                                            <input type="radio" id='Near' value="Near miss" name="harm" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='Near'>Near miss</label>
                                                        </div>
                                                        <div className='self-section' onClick={() => this.setState({ LevelofHarm: "No harm" })}>
                                                            <input type="radio" id='Noharm' value="No harm" name="harm" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='No harm'>No harm</label>
                                                        </div>
                                                        <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Resulted in harm" })}>
                                                            <input type="radio" id='Resulted' value="Resulted in harm" name="harm" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='Resulted'>Resulted in harm</label>
                                                        </div>
                                                        <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Sentinel Event" })}>
                                                            <input type="radio" id='Sentinel' value="Sentinel Event" name="harm" autoComplete='off' className='training_booking'
                                                                placeholder="Training Name"
                                                            />
                                                            <label htmlFor='Sentinel'>Sentinel Event</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3" id='reporter-section' style={{ display: "none" }}>
                                                    <label> Reporter Name </label>
                                                    <input type="text" id="reporter_name" className="form-control" placeholder="Enter Reporter Name" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="create_details">
                                            <h2>Classifications of Incidents </h2>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <label>	Communication and Information </label>
                                                    <textarea placeholder="Enter Communication" id='Communication' className="form-control"></textarea>
                                                </div>
                                                <div className="col-md-3">
                                                    <label>	Education and Competency </label>
                                                    <textarea placeholder="Enter Education" id='Education' className="form-control"></textarea>

                                                </div>
                                                <div className="col-md-3">
                                                    <label>	Environment and Organization </label>
                                                    <textarea placeholder="Enter Environment" id='Environment' className="form-control"></textarea>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="relative"> Technology, Equipment and Apparatus
                                                    </label>
                                                    <textarea placeholder="Enter Technology" id='Technology' className="form-control"></textarea>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-3 relative">
                                                    <label>	Procedures, routines and Guidelines  </label>
                                                    <textarea placeholder="Enter Procedures" id='Procedures' className="form-control"></textarea>

                                                </div>
                                            </div>

                                        </div>
                                        <div className="create_details view_details_table">
                                            <h2> Approver Details </h2>
                                            <div className="approver_table">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-center">S.No</th>
                                                            <th>Assigned On</th>
                                                            <th> Approver Level </th>
                                                            <th> Approver Name </th>
                                                            <th>Action Taken On</th>
                                                            <th> RequestID </th>
                                                            <th className="text-center"> Status </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {this.state.WFDetails.map((item, key) => {
                                                            var titles = item.AssignedTo.map((obj: any) => obj.Title);
                                                            return (
                                                                <tr>
                                                                    <td className='text-center'>{key + 1}</td>
                                                                    <td>{moment(item.Created).format("DD-MM-YYYY hh:mm A")}</td>
                                                                    <td>{item.Title}</td>
                                                                    <td>{titles.join(",")}</td>
                                                                    <td>{item.ActionTakenOn == null || undefined || "" ? "-" : item.ActionTakenOn}</td>
                                                                    <td>{item.RequestID}</td>
                                                                    <td className={item.Status == "Approved" ? "text-center sts-Approved" : item.Status == "Rejected" ? "text-center sts-Rejected" : "text-center sts-Pending"}><span>{item.Status}</span></td>
                                                                </tr>
                                                            )
                                                        })}

                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        {this.state.CurrentStatus == "Pending" &&
                                            <div className="create_btn">
                                                <button className="submit_btn approve-btn" onClick={() => this.Approved()} > Approve </button>
                                                <button className="cancel_btn reject-btn" onClick={() => this.Rejected()}> Reject </button>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </section>

                    </>
                }
                {this.state.Dashboard == true &&
                    <Dashboard siteurl={this.props.siteurl} itemId={0} />
                }

            </>
        );
    }
}
