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



var NewWeb: any;
var RequestID: any;

export interface FormState {
    Dashboard: boolean;
    NewForm: boolean;
    CurrentUserName: string;
    CurrentUserID: number;
    CurrentUserProfilePic: string;
    Departments: any[];
    setSelectedDepartment: any[];
    Approvers: any[];
    LevelofHarm: string;
    isAnonymous: boolean;
    DepartmentOptions: any[];
}

export default class NewForm extends React.Component<IDashboardProps, FormState, {}> {
    public constructor(props: IDashboardProps, state: FormState) {
        super(props);
        this.state = {
            Dashboard: false,
            NewForm: true,
            CurrentUserName: "",
            CurrentUserID: 0,
            CurrentUserProfilePic: "",
            Departments: [],
            setSelectedDepartment: [],
            Approvers: [],
            LevelofHarm: "",
            isAnonymous: false,
            DepartmentOptions: []
        }
        NewWeb = Web("" + this.props.siteurl + "")

        SPComponentLoader.loadCss(`https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css`);
        SPComponentLoader.loadCss(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`);
        SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/style.css?v=2.9`);
        SPComponentLoader.loadCss(`${this.props.siteurl}/SiteAssets/HarmForm/css/mediastyle.css?v=2.9`);
    }
    public componentDidMount() {
        this.GetCurrentUserDetails()
        this.getDepartments()
        this.getApproverDetails()
        this.getTransactionListLength()
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
    public async getTransactionListLength() {
        try {
            await NewWeb.lists.getByTitle("HarmForm Transaction").items.select("*")
                .top(1)
                .orderBy("Id", false)
                .get()
                .then((items: any) => {
                    if (items.length != 0) {
                        var length = parseInt(items[0].ID) + 1
                        RequestID = "SKMCA/F03-04-" + length + ""
                    } else {
                        RequestID = "SKMCA/F03-04-1"
                    }
                });
        } catch (err) {
            console.log("HarmForm Transaction : " + err);
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
    public async getApproverDetails() {
        try {
            await NewWeb.lists.getByTitle("Harm Form Approver Master").items.select("*")
                .get()
                .then((items: any) => {
                    var ApproverID: any[] = []
                    if (items.length != 0) {
                        console.log(items)
                        items[0].Level1ApproverId.map((id: any) => {
                            ApproverID.push(id)
                        })
                        this.setState({
                            Approvers: ApproverID
                        })
                    }
                });
        } catch (err) {
            console.log("Harm Form Approver Master : " + err);
        }
    }
    public saveFormDetails() {
        // var Department = this.state.setSelectedDepartment
        NewWeb.lists.getByTitle("HarmForm Transaction").items.add({
            Location: $("#location").val(),
            DateofIncident: $("#incident").val(),
            DateReportedtoQuality: $("#date_quality").val(),
            Anonymous: this.state.isAnonymous,
            ReporterName: $("#reporter_name").val(),
            InvolvedDepartment: $("#department_name").val(),
            LevelofHarm: this.state.LevelofHarm,
            Communication: $("#Communication").val(),
            Education: $("#Education").val(),
            Environment: $("#Environment").val(),
            Technology: $("#Technology").val(),
            Procedures: $("#Procedures").val(),
            RequestID: RequestID
        }).then(() => {
            NewWeb.lists.getByTitle("HarmForm WF History").items.add({
                Title: "Level1",
                AssignedToId: {
                    results: this.state.Approvers
                },
                AssignedById: this.state.CurrentUserID,
                Status: "Pending",
                RequestID: RequestID
            })
        }).then(() => {
            swal({
                text: "Submitted successfully!",
                icon: "success",
            }).then(() => {
                location.reload();
            })
        })
    }
    public anonymousTrue() {
        $("#reporter-section").show()
        this.setState({ isAnonymous: true })
    }
    public anonymousFalse() {
        $("#reporter-section").hide()
        this.setState({ isAnonymous: false })
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
                {this.state.NewForm == true &&
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
                                <div className="dashboard-wrap-create">
                                    <div className="create-heading-block clearfix">
                                        <a href="https://remodigital.sharepoint.com/sites/Remo/RemoSolutions/DigitalForms/POC/SitePages/HarmForm.aspx?env=WebView"> <img src={`${this.props.siteurl}/SiteAssets/HarmForm/img/next.svg`} />
                                            <span> Incident Classification Form </span> </a>
                                    </div>
                                    <div className="create_banner">
                                        <div className="create_details">
                                            <h2>Details of Incident Classification </h2>
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
                                                <div className="col-md-3">
                                                    <label> Anonymous </label>
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
                                                <div className="col-md-3">
                                                    <label>Level of Harm</label>
                                                    <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Reportable circumstances" })}>
                                                        <input type="radio" id='Reportable' value="self" name="harm" autoComplete='off' className='training_booking'
                                                            placeholder="Training Name"
                                                        />
                                                        <label htmlFor='Reportable'>Reportable circumstances</label>
                                                    </div>
                                                    <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Near miss" })}>
                                                        <input type="radio" id='Near' value="self" name="harm" autoComplete='off' className='training_booking'
                                                            placeholder="Training Name"
                                                        />
                                                        <label htmlFor='Near'>Near miss</label>
                                                    </div>
                                                    <div className='self-section' onClick={() => this.setState({ LevelofHarm: "No harm" })}>
                                                        <input type="radio" id='No harm' value="self" name="harm" autoComplete='off' className='training_booking'
                                                            placeholder="Training Name"
                                                        />
                                                        <label htmlFor='No harm'>No harm</label>
                                                    </div>
                                                    <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Resulted in harm" })}>
                                                        <input type="radio" id='Resulted' value="self" name="harm" autoComplete='off' className='training_booking'
                                                            placeholder="Training Name"
                                                        />
                                                        <label htmlFor='Resulted'>Resulted in harm</label>
                                                    </div>
                                                    <div className='self-section' onClick={() => this.setState({ LevelofHarm: "Sentinel Event" })}>
                                                        <input type="radio" id='Sentinel' value="self" name="harm" autoComplete='off' className='training_booking'
                                                            placeholder="Training Name"
                                                        />
                                                        <label htmlFor='Sentinel'>Sentinel Event</label>
                                                    </div>
                                                </div>
                                                <div className="col-md-3" id='reporter-section' style={{ display: "none" }}>
                                                    <label> Reporter Name </label>
                                                    <input autoComplete='off' type="text" id="reporter_name" className="form-control" placeholder="Enter Reporter Name" />
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
                                        <div className="create_btn">
                                            <button className="submit_btn" onClick={() => this.saveFormDetails()}> Submit </button>
                                            <button className="cancel_btn" onClick={() => location.reload()}> Cancel </button>
                                        </div>
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
