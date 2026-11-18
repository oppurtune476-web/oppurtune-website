
const DB={
 users:"opp_users",projects:"opp_projects",applications:"opp_apps",
 saved:"opp_saved",resumes:"opp_resumes",submissions:"opp_submissions",
 feedback:"opp_feedback",session:"opp_session"
};
const read=k=>JSON.parse(localStorage.getItem(k)||"[]");
const current=()=>JSON.parse(sessionStorage.getItem(DB.session)||"null");
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let role="student",mode="login";

const API_BASE = "http://localhost:5000";
let legacyBackup = null;
function normalizeProject(p){return {...p,id:p.id||p._id,business:typeof p.business==="object"?p.business?.name:(p.business||"Community"),students:p.studentCount??p.students??0,demo:p.isDemo===true};}
function normalizeApplication(a){return {...a,id:a.id||a._id,projectId:a.project?.id||a.projectId,studentId:a.student?.id||a.studentId,studentName:a.student?.name||a.studentName,project:a.project||null};}
async function api(path,options={}){
  const token=sessionStorage.getItem("opp_token"),headers={...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})};
  if(token)headers.Authorization=`Bearer ${token}`;
  let response;
  try{response=await fetch(`${API_BASE}${path}`,{...options,headers});}catch{throw new Error("Cannot reach OPPURTUNE server. Start the backend and try again.");}
  const data=await response.json().catch(()=>({message:"The server returned an unreadable response."}));
  if(response.status===401&&token){sessionStorage.removeItem(DB.session);sessionStorage.removeItem("opp_token");showPage("home");alert("Your session expired. Please log in again.");}
  if(!response.ok)throw new Error(data.message||`Request failed (${response.status}).`);
  return data;
}
const jsonBody=value=>JSON.stringify(value);

function showPage(page){
  updateDashboardNavigation();
  document.querySelectorAll(".page-section").forEach(x=>x.style.display="none");
  const target=document.getElementById(page);
  if(target)target.style.display="block";
  document.getElementById("navLinks")?.classList.remove("open");
  window.scrollTo(0,0);
  if(page==="explore")renderProjects();
}
function toggleMenu(){document.getElementById("navLinks").classList.toggle("open")}
function updateDashboardNavigation(){const link=document.getElementById("dashboardNavLink");if(!link)return;const navigation=window.dashboardNavigationForRole?.(current()?.role);if(!navigation){link.style.display="none";return;}link.textContent=navigation.label;link.style.display="";}

function openAuth(which,whichMode){
  role=which;mode=whichMode;
  showPage("auth");
  setAuthMode(whichMode);
}
function setAuthMode(whichMode){
  mode=whichMode;
  document.querySelectorAll("[data-role-choice]").forEach(button=>{
    const active=button.dataset.roleChoice===role;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  document.getElementById("loginTab").classList.toggle("active",mode==="login");
  document.getElementById("registerTab").classList.toggle("active",mode==="register");
  document.getElementById("registerTab").style.display=role==="admin"?"none":"block";
  document.getElementById("authTitle").textContent=role[0].toUpperCase()+role.slice(1)+" "+(mode==="login"?"Login":"Registration");
  document.getElementById("authSubtitle").textContent=mode==="login"?"Login to your "+role+" account":"Create your "+role+" account";
  document.getElementById("authSubmit").textContent=mode==="login"?"Login":"Create Account";
  document.getElementById("authMessage").textContent="";
  document.getElementById("registerFields").innerHTML=mode==="register"?registerFields():"";
  document.getElementById("demoCredentials").textContent="";
  document.getElementById("authPassword").type="password";
  document.getElementById("togglePassword").textContent="Show";
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("authPassword");
  const toggleButton = document.getElementById("togglePassword");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleButton.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    toggleButton.textContent = "Show";
  }
}

function forgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById("authEmail").value.trim();

  const message = document.getElementById("authMessage");

  if (!email) {
    message.textContent = "Please enter your registered email address first.";
    return;
  }

  message.textContent =
    "Password reset service is not connected yet. Please contact support.";
}
function registerFields(){
  if(role==="student")return `
    <label for="fullName">Full Name</label><input id="fullName" required placeholder="Your full name">
    <label for="college">College Name</label><input id="college" required placeholder="College name">
    <label for="course">Course</label><select id="course" required>
      <option value="">Select course</option><option>B.Tech CSE</option><option>B.Tech IT</option>
      <option>B.Tech CSE (IoT)</option><option>B.Tech AI/ML</option><option>B.Tech Data Science</option>
      <option>B.Tech Cyber Security</option><option>B.Tech ECE</option><option>B.Tech EEE</option>
      <option>B.Tech Mechanical</option><option>B.Tech Civil</option><option>BCA</option><option>MCA</option><option>Other</option>
    </select>
    <label for="studyYear">Year of Study</label><select id="studyYear"><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Final Year</option></select>
    <label for="skills">Skills</label><input id="skills" placeholder="Python, Java, IoT...">`;
  return `
    <label for="fullName">Business Name</label><input id="fullName" required placeholder="Business name">
    <label for="contactPerson">Contact Person</label><input id="contactPerson" required placeholder="Your name">
    <label for="businessDescription">Business Description</label><textarea id="businessDescription" placeholder="Describe your business"></textarea>`;
}


document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const password = document.getElementById("authPassword").value;
  const msg = document.getElementById("authMessage");
  const submitButton = document.getElementById("authSubmit");

  const payload = {
    email,
    password,
    role
  };

  if (mode === "register") {
    payload.name = document.getElementById("fullName").value.trim();

    if (role === "student") {
      payload.college = document.getElementById("college").value;
      payload.course = document.getElementById("course").value;
      payload.year = document.getElementById("studyYear").value;
      payload.skills = document.getElementById("skills").value;
    }

    if (role === "business") {
      payload.contactPerson = document.getElementById("contactPerson").value;
      payload.description = document.getElementById("businessDescription").value;
    }
  }

  submitButton.disabled = true;
  submitButton.textContent = "Please wait...";

  try {
    const endpoint = mode === "register" ? "register" : "login";

    const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    // Business registration waits for Admin approval.
    if (mode === "register" && role === "business") {
      msg.style.color = "green";
      msg.textContent = data.message;
      document.getElementById("authForm").reset();
      return;
    }

    // Save the authenticated session for this browser tab.
    sessionStorage.setItem("opp_token", data.token);

    sessionStorage.setItem(
      DB.session,
      JSON.stringify({
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email
      })
    );

    openDashboard();

  } catch (error) {
    msg.style.color = "#bd2b42";
    msg.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent =
      mode === "login" ? "Login" : "Create Account";
  }
});

function logout() {
  sessionStorage.removeItem(DB.session);
  sessionStorage.removeItem("opp_token");
  showPage("home");
}
function openDashboard(){
  const s=current();if(!s)return showPage("home");
  if(s.role==="student"){
    showPage("studentDashboard");document.getElementById("studentName").textContent=s.name;studentTab("overview");
  }else if(s.role==="business"){showPage("businessDashboard");businessTab("overview")}
  else{showPage("adminDashboard");adminTab("overview")}
}
function allowed(r){
  const s=current();
  if(!s||s.role!==r){alert("Please login with the correct "+r+" account.");return false}
  return true;
}

async function renderProjects(){
  const q=(document.getElementById("projectSearch")?.value||document.getElementById("homeSearch")?.value||"").trim();
  try{const {projects=[]}=await api(`/api/projects${q?`?q=${encodeURIComponent(q)}`:""}`);const items=projects.map(normalizeProject);const html=items.length?items.map(projectCard).join(""):`<div class="empty-state">No matching projects found.</div>`;if(document.getElementById("homeProjects"))document.getElementById("homeProjects").innerHTML=items.slice(0,3).map(projectCard).join("");if(document.getElementById("allProjects"))document.getElementById("allProjects").innerHTML=html;}catch(error){const html=`<div class="empty-state">${safe(error.message)}</div>`;if(document.getElementById("homeProjects"))document.getElementById("homeProjects").innerHTML=html;if(document.getElementById("allProjects"))document.getElementById("allProjects").innerHTML=html;}
}
function projectCard(p){return `<article class="project-card"><div class="project-top"><span class="company-name">${safe(p.business)}</span><span class="pill ${p.payment==="Paid"?"paid":""}">${safe(p.payment)}</span></div><h3>${safe(p.title)}</h3><p>${safe(p.description)}</p><div class="project-meta"><span>✳ ${safe(p.skills)}</span><span>◷ ${safe(p.duration)}</span><span>♟ ${safe(p.students)} Students</span></div><div class="project-actions"><button class="small-btn secondary" onclick="saveProject('${p.id}')">☆ Save</button><button class="small-btn" onclick="viewProject('${p.id}')">View Details →</button></div></article>`;}
async function viewProject(pid){try{const {project}=await api(`/api/projects/${encodeURIComponent(pid)}`);const p=normalizeProject(project),detail=document.createElement("div");detail.className="data-card";detail.id="projectDetail";detail.innerHTML=`<button class="back-link" onclick="this.parentElement.remove()">Close ×</button><h2>${safe(p.title)}</h2><p><b>Business:</b> ${safe(p.business)}</p><p>${safe(p.description)}</p><p><b>Skills:</b> ${safe(p.skills)}</p><p><b>Duration:</b> ${safe(p.duration)} · <b>Students:</b> ${safe(p.students)} · <b>Payment:</b> ${safe(p.payment)}</p><button class="action-btn" onclick="applyProject('${p.id}')">Apply for Project</button>`;document.getElementById("allProjects").prepend(detail);detail.scrollIntoView({behavior:"smooth"});}catch(error){alert(error.message);}}
async function applyProject(pid){if(!allowed("student"))return;try{await api(`/api/projects/${encodeURIComponent(pid)}/applications`,{method:"POST",body:"{}"});alert("Application submitted!");studentTab("applications");}catch(error){alert(error.message);}}
async function saveProject(pid){if(!allowed("student"))return;try{await api(`/api/saved/${encodeURIComponent(pid)}`,{method:"POST",body:"{}"});alert("Project saved.");}catch(error){alert(error.message);}}
async function unsaveProject(pid){try{await api(`/api/saved/${encodeURIComponent(pid)}`,{method:"DELETE"});studentTab("saved");}catch(error){alert(error.message);}}
async function studentTab(tab){if(!allowed("student"))return;const panel=document.getElementById("studentPanel");try{
  if(tab==="overview"){const [{applications=[]},{savedProjects=[]}]=await Promise.all([api("/api/applications/me"),api("/api/saved")]);panel.innerHTML=`<div class="stats-grid"><div class="stat-card"><strong>${applications.length}</strong><span>Applications</span></div><div class="stat-card"><strong>${applications.filter(a=>a.status==="Selected").length}</strong><span>Selected Projects</span></div><div class="stat-card"><strong>${savedProjects.length}</strong><span>Saved Projects</span></div></div><div class="panel-card"><h2>Explore opportunities</h2><p>Apply to real business challenges and build practical experience.</p><br><button class="btn primary" onclick="showPage('explore')">Explore Projects</button></div>`;}
  if(tab==="applications"){const {applications=[]}=await api("/api/applications/me");panel.innerHTML=`<h2>My Applications</h2>${applications.map(raw=>{const a=normalizeApplication(raw),p=normalizeProject(raw.project||{});return `<div class="data-card"><h3>${safe(p.title)}</h3><p>${safe(p.business)} · Status: <b>${safe(a.status)}</b></p>${a.status==="Selected"?`<button class="action-btn" onclick="workspace('${a.id}')">Open Workspace</button>`:""}</div>`}).join("")||`<div class="empty-state">No applications yet.</div>`}`;}
  if(tab==="saved"){const {savedProjects=[]}=await api("/api/saved");panel.innerHTML=`<h2>Saved Projects</h2><div class="project-grid">${savedProjects.map(x=>normalizeProject(x.project||{})).filter(p=>p.id).map(p=>`<div>${projectCard(p)}<button class="action-btn reject" onclick="unsaveProject('${p.id}')">Remove saved</button></div>`).join("")||"<div class='empty-state'>No saved projects.</div>"}</div>`;}
  if(tab==="resume")await resumeBuilder(panel,current());
  if(tab==="portfolio"){const {portfolio=[]}=await api("/api/portfolio/me");panel.innerHTML=`<h2>My Portfolio</h2>${portfolio.map(x=>`<div class="data-card"><h3>${safe(x.project?.title)}</h3><p>${safe(x.project?.business)}</p><p><b>Feedback:</b> ${safe(x.feedback||"Not received yet.")}</p></div>`).join("")||"<div class='empty-state'>Selected projects will appear here.</div>"}`;}
}catch(error){panel.innerHTML=`<div class="empty-state">${safe(error.message)}</div>`;}}
async function resumeBuilder(panel,s){let old={};try{old=(await api("/api/resume/me")).resume||{};}catch(error){panel.innerHTML=`<div class="empty-state">${safe(error.message)}</div>`;return;}panel.innerHTML=`<h2>Resume Builder</h2><div class="panel-card"><form id="resumeForm" class="form-grid">${resumeInput("Phone","phone",old.phone)}${resumeInput("Career Objective","objective",old.objective,true)}${resumeInput("Education","education",old.education,true)}${resumeInput("Technical Skills","skills",old.skills,true)}${resumeInput("Projects","projects",old.projects,true)}${resumeInput("Certifications","certifications",old.certifications,true)}${resumeInput("Achievements","achievements",old.achievements,true)}<div class="form-field full-width"><button class="btn primary">Generate Resume</button></div></form></div><div id="resumeResult"></div>`;document.getElementById("resumeForm").onsubmit=async e=>{e.preventDefault();const data={};["phone","objective","education","skills","projects","certifications","achievements"].forEach(k=>data[k]=document.getElementById("r_"+k).value);try{const saved=(await api("/api/resume/me",{method:"PUT",body:jsonBody(data)})).resume;showResume(saved,s);}catch(error){alert(error.message);}};if(Object.values(old).some(Boolean))showResume(old,s);}
function resumeInput(label,key,value,multi=false){return `<div class="form-field ${multi?"full-width":""}"><label for="r_${key}">${label}</label>${multi?`<textarea id="r_${key}">${safe(value||"")}</textarea>`:`<input id="r_${key}" value="${safe(value||"")}">`}</div>`;}
function showResume(data,s){document.getElementById("resumeResult").innerHTML=`<div class="resume-preview" id="printArea"><h2>${safe(s.name)}</h2><p>${safe(s.email)} · ${safe(data.phone)}</p>${["objective","education","skills","projects","certifications","achievements"].map(k=>`<h3>${k.toUpperCase()}</h3><p>${safe(data[k]).replace(/\n/g,"<br>")}</p>`).join("")}</div><button class="btn primary" onclick="printResume()">Print / Save as PDF</button>`;}
function printResume(){const html=document.getElementById("printArea")?.innerHTML;if(!html)return;const w=window.open("","_blank");if(!w){alert("Allow pop-ups to print.");return;}w.document.write(`<html><head><title>Resume</title><style>body{font-family:Arial;padding:35px;line-height:1.6}h2{color:#54269a}h3{border-bottom:1px solid #ddd;margin-top:20px}</style></head><body>${html}</body></html>`);w.document.close();w.print();}
async function workspace(appId){try{const [{applications=[]},{submission},{feedback}]=await Promise.all([api("/api/applications/me"),api(`/api/applications/${encodeURIComponent(appId)}/submission`),api(`/api/applications/${encodeURIComponent(appId)}/feedback`)]);const a=applications.find(x=>String(x.id)===String(appId));if(!a)return;const p=normalizeProject(a.project||{}),panel=document.getElementById("studentPanel");panel.innerHTML=`<div class="panel-card"><h2>${safe(p.title)}</h2><p>${safe(p.description)}</p><form id="workForm"><label for="workText">Your work / solution</label><textarea id="workText" required>${safe(submission?.text||"")}</textarea><button class="btn primary">Submit Work</button></form><p><b>Business feedback:</b> ${safe(feedback?.text||"Not received yet.")}</p></div>`;document.getElementById("workForm").onsubmit=async e=>{e.preventDefault();try{await api(`/api/applications/${encodeURIComponent(appId)}/submission`,{method:"PUT",body:jsonBody({text:document.getElementById("workText").value})});alert("Work submitted.");studentTab("applications");}catch(error){alert(error.message);}};}catch(error){alert(error.message);}}
function businessApplicationStatusActions(application){const next={"Applied":[["Under Review","Under Review","neutral"],["Shortlisted","Shortlist",""],["Selected","Select Student",""]],"Under Review":[["Shortlisted","Shortlist",""],["Selected","Select Student",""]],"Shortlisted":[["Selected","Select Student",""]]}[application.status]||[];return next.map(([status,label,style])=>`<button class="action-btn ${style}" onclick="changeApp('${application.id}','${status}')">${label}</button>`).join("");}
async function businessTab(tab){if(!allowed("business"))return;const s=current(),panel=document.getElementById("businessPanel");try{const {projects=[]}=await api("/api/projects/mine");
  if(tab==="overview"){const {applications=[]}=await api("/api/business/applications");panel.innerHTML=`<div class="stats-grid"><div class="stat-card"><strong>${projects.length}</strong><span>Projects Posted</span></div><div class="stat-card"><strong>${projects.filter(p=>p.status==="Approved").length}</strong><span>Approved Projects</span></div><div class="stat-card"><strong>${applications.length}</strong><span>Applications</span></div></div><div class="panel-card"><h2>Welcome, ${safe(s.name)}</h2><p>Post a real business problem for students to solve.</p></div>`;}
  if(tab==="post"){panel.innerHTML=`<div class="panel-card"><h2>Post a Business Problem</h2><form id="postForm" class="form-grid"><div class="form-field full-width"><label for="pTitle">Problem Title</label><input id="pTitle" required></div><div class="form-field"><label for="pCategory">Category</label><input id="pCategory" maxlength="100"></div><div class="form-field full-width"><label for="pDesc">Description</label><textarea id="pDesc" required></textarea></div><div class="form-field"><label for="pSkills">Required Skills</label><input id="pSkills" required></div><div class="form-field"><label for="pDuration">Duration</label><input id="pDuration" placeholder="4 Weeks" required></div><div class="form-field"><label for="pStudents">Number of Students</label><input id="pStudents" type="number" min="1" value="2" required></div><div class="form-field"><label for="pPayment">Payment</label><select id="pPayment"><option>Unpaid</option><option>Paid</option></select></div><div class="form-field full-width"><button class="btn primary">Submit for Admin Approval</button></div></form></div>`;document.getElementById("postForm").onsubmit=async e=>{e.preventDefault();const body={title:document.getElementById("pTitle").value,category:document.getElementById("pCategory").value,description:document.getElementById("pDesc").value,skills:document.getElementById("pSkills").value,duration:document.getElementById("pDuration").value,studentCount:Number(document.getElementById("pStudents").value),payment:document.getElementById("pPayment").value};try{await api("/api/projects",{method:"POST",body:jsonBody(body)});alert("Project submitted for Admin approval.");businessTab("projects");}catch(error){alert(error.message);}};}
  if(tab==="projects")panel.innerHTML=`<h2>My Projects</h2>${projects.map(businessProjectCard).join("")||"<div class='empty-state'>No projects posted.</div>"}`;
  if(tab==="applications"){const [{applications=[]},{submissions=[]},{feedback=[]}]=await Promise.all([api("/api/business/applications"),api("/api/business/submissions"),api("/api/business/feedback")]);panel.innerHTML=`<h2>Student Applications</h2>${applications.map(raw=>{const a=normalizeApplication(raw),p=normalizeProject(raw.project||{}),sub=submissions.find(x=>x.application?.id===a.id),f=feedback.find(x=>x.application?.id===a.id),skills=raw.student?.skills;return `<div class="data-card"><h3>${safe(raw.student?.name)}</h3><p>Project: ${safe(p.title)}</p><p>Course: ${safe(raw.student?.course||"")}</p><p>Skills: ${safe(Array.isArray(skills)?skills.join(", "):skills||"")}</p><p>Status: <b>${safe(a.status)}</b></p><div class="action-row">${businessApplicationStatusActions(a)}</div><p><b>Submitted work:</b> ${safe(sub?.text||"Not submitted yet.")}</p><form class="feedback-form" onsubmit="sendFeedback(event,'${a.id}')"><label for="feedback-${a.id}">Feedback</label><textarea id="feedback-${a.id}" name="feedback" required>${safe(f?.text||"")}</textarea><button class="action-btn">Send Feedback</button></form></div>`;}).join("")||"<div class='empty-state'>No applications received yet.</div>"}`;}
}catch(error){panel.innerHTML=`<div class="empty-state">${safe(error.message)}</div>`;}}
function businessProjectCard(project){return `<div class="data-card"><h3>${safe(project.title)}</h3><p>Status: <b>${safe(project.status)}</b></p>${project.category?`<p>Category: ${safe(project.category)}</p>`:""}<p>${safe(project.description)}</p>${project.isDemo||project.isDeleted?"":`<button class="action-btn" onclick="editBusinessProject('${project.id}')">Edit</button>`}</div>`;}
async function editBusinessProject(projectId){const panel=document.getElementById("businessPanel");try{const {projects=[]}=await api("/api/projects/mine"),project=projects.find(item=>item.id===projectId&&!item.isDemo&&!item.isDeleted);if(!project){alert("This project is unavailable for editing.");return;}panel.innerHTML=`<div class="panel-card"><h2>Edit Project</h2><form id="editProjectForm" class="form-grid"><div class="form-field full-width"><label for="editTitle">Problem Title</label><input id="editTitle" value="${safe(project.title)}" maxlength="160" required></div><div class="form-field"><label for="editCategory">Category</label><input id="editCategory" value="${safe(project.category||"")}" maxlength="100"></div><div class="form-field full-width"><label for="editDescription">Description</label><textarea id="editDescription" maxlength="10000" required>${safe(project.description)}</textarea></div><div class="form-field"><label for="editSkills">Required Skills</label><input id="editSkills" value="${safe(project.skills)}" maxlength="1000" required></div><div class="form-field"><label for="editDuration">Duration</label><input id="editDuration" value="${safe(project.duration)}" maxlength="120" required></div><div class="form-field"><label for="editStudentCount">Number of Students</label><input id="editStudentCount" type="number" min="1" step="1" value="${safe(project.studentCount)}" required></div><div class="form-field"><label for="editPayment">Payment</label><select id="editPayment"><option value="Unpaid" ${project.payment==="Unpaid"?"selected":""}>Unpaid</option><option value="Paid" ${project.payment==="Paid"?"selected":""}>Paid</option></select></div><div class="form-field full-width"><p id="projectEditMessage" aria-live="polite"></p><button class="btn primary" id="saveProjectChanges">Save Changes</button> <button class="btn outline" type="button" onclick="businessTab('projects')">Cancel</button></div></form></div>`;document.getElementById("editProjectForm").onsubmit=async event=>{event.preventDefault();const button=document.getElementById("saveProjectChanges"),message=document.getElementById("projectEditMessage");button.disabled=true;message.textContent="Saving changes…";const body={title:document.getElementById("editTitle").value,category:document.getElementById("editCategory").value,description:document.getElementById("editDescription").value,skills:document.getElementById("editSkills").value,duration:document.getElementById("editDuration").value,studentCount:Number(document.getElementById("editStudentCount").value),payment:document.getElementById("editPayment").value};try{await api(`/api/projects/${encodeURIComponent(projectId)}`,{method:"PATCH",body:jsonBody(body)});alert("Project updated successfully.");await businessTab("projects");}catch(error){message.textContent=error.message;button.disabled=false;}};}catch(error){alert(error.message);}}
async function changeApp(appId,status){try{await api(`/api/applications/${encodeURIComponent(appId)}/status`,{method:"PATCH",body:jsonBody({status})});businessTab("applications");}catch(error){alert(error.message);}}
async function sendFeedback(e,appId){e.preventDefault();try{await api(`/api/applications/${encodeURIComponent(appId)}/feedback`,{method:"PUT",body:jsonBody({text:e.target.feedback.value})});alert("Feedback saved.");businessTab("applications");}catch(error){alert(error.message);}}
function businessAccountStatus(business){if(business.status==="Approved"||business.approved===true)return "Approved";if(business.status==="Rejected"||business.rejectedAt)return "Rejected";return "Pending";}
function businessManagementCard(business,status){const action=status==="Rejected"?`<button class="action-btn" onclick="setBusiness('${safe(business.id)}','Approved')">Approve</button>`:status==="Approved"?`<button class="action-btn reject" onclick="setBusiness('${safe(business.id)}','Rejected')">Reject</button>`:`<button class="action-btn" onclick="setBusiness('${safe(business.id)}','Approved')">Approve</button><button class="action-btn reject" onclick="setBusiness('${safe(business.id)}','Rejected')">Reject</button>`;return `<div class="data-card"><h4>${safe(business.name)}</h4><p>${safe(business.email)}</p><p>Contact: ${safe(business.contactPerson||"Not provided")}</p><p>${safe(business.description||"")}</p><p>Registered: ${business.createdAt?safe(new Date(business.createdAt).toLocaleDateString()):"Date unavailable"}</p><p>Status: <b>${status}</b></p><div class="action-row">${action}</div></div>`;}
function businessManagementGroup(label,businesses,status){return `<section><h3>${label} (${businesses.length})</h3>${businesses.map(business=>businessManagementCard(business,status)).join("")||`<div class="empty-state">No ${label.toLowerCase()}.</div>`}</section>`;}
async function adminTab(tab){if(!allowed("admin"))return;const panel=document.getElementById("adminPanel");try{
  if(tab==="overview"){const [{users=[]},{projects=[]}]=await Promise.all([api("/api/admin/users"),api("/api/admin/projects")]);panel.innerHTML=`<div class="stats-grid"><div class="stat-card"><strong>${users.filter(u=>u.role==="student").length}</strong><span>Students</span></div><div class="stat-card"><strong>${users.filter(u=>u.role==="business").length}</strong><span>Businesses</span></div><div class="stat-card"><strong>${projects.length}</strong><span>Total Projects</span></div></div><div class="panel-card"><h2>Admin Control Center</h2><p>Approve business registrations and review projects before publishing.</p></div><div class="panel-card"><h2>Legacy data migration</h2><p>Back up browser data, preview counts and unresolved references, then import matched records. Local data remains in this browser.</p><button class="action-btn" onclick="previewMigration()">Back up and preview</button> <button class="action-btn neutral" onclick="importMigration()">Import after preview</button><div id="migrationReport" aria-live="polite"></div></div>`;}
  if(tab==="businesses"){const {businesses=[]}=await api("/api/admin/businesses"),pending=businesses.filter(b=>businessAccountStatus(b)==="Pending"),approved=businesses.filter(b=>businessAccountStatus(b)==="Approved"),rejected=businesses.filter(b=>businessAccountStatus(b)==="Rejected");panel.innerHTML=`<h2>Business Account Management</h2>${businessManagementGroup("Pending Businesses",pending,"Pending")}${businessManagementGroup("Approved Businesses",approved,"Approved")}${businessManagementGroup("Rejected Businesses",rejected,"Rejected")}`;}
  if(tab==="projects"){const {projects=[]}=await api("/api/admin/projects");panel.innerHTML=`<h2>Project Approvals</h2>${projects.map(p=>`<div class="data-card"><h3>${safe(p.title)}</h3><p>Business: ${safe(typeof p.business==="object"?p.business?.name:p.business)}</p><p>${safe(p.description)}</p><p>Status: <b>${safe(p.status)}</b></p><div class="action-row"><button class="action-btn" onclick="setProject('${p.id}','Approved')">Approve</button><button class="action-btn reject" onclick="setProject('${p.id}','Rejected')">Reject</button><button class="action-btn neutral" onclick="removeProject('${p.id}')">Remove</button></div></div>`).join("")||"<div class='empty-state'>No business-submitted projects.</div>"}`;}
  if(tab==="users"){const {users=[]}=await api("/api/admin/users");panel.innerHTML=`<h2>User Accounts</h2>${users.map(u=>`<div class="data-card"><h3>${safe(u.name)}</h3><p>${safe(u.email)} · ${safe(u.role)}</p><p>Status: <b>${safe(u.status)}</b></p></div>`).join("")||"<div class='empty-state'>No accounts.</div>"}`;}
}catch(error){panel.innerHTML=`<div class="empty-state">${safe(error.message)}</div>`;}}
async function setBusiness(uid,status){try{await api(`/api/admin/businesses/${encodeURIComponent(uid)}/approval`,{method:"PATCH",body:jsonBody({status})});alert(`Business account ${status.toLowerCase()}.`);await adminTab("businesses");}catch(error){alert(error.message);}}
async function setProject(pid,status){try{await api(`/api/admin/projects/${encodeURIComponent(pid)}/status`,{method:"PATCH",body:jsonBody({status})});adminTab("projects");}catch(error){alert(error.message);}}
async function removeProject(pid){if(!confirm("Remove this project? Its application history will be preserved."))return;try{await api(`/api/admin/projects/${encodeURIComponent(pid)}`,{method:"DELETE"});adminTab("projects");}catch(error){alert(error.message);}}
function migrationData(){const map={users:DB.users,projects:DB.projects,applications:DB.applications,saved:DB.saved,resumes:DB.resumes,submissions:DB.submissions,feedback:DB.feedback},data={};for(const [type,key] of Object.entries(map)){let records=read(key);if(type==="users")records=records.map(({id,email,role})=>({id,email,role}));data[type]=records;}data.seedMarker=localStorage.getItem("opp_seed_v2");return data;}
function downloadLegacyBackup(){const keys=[DB.users,DB.projects,DB.applications,DB.saved,DB.resumes,DB.submissions,DB.feedback,"opp_seed_v2"],snapshot={createdAt:new Date().toISOString(),localStorage:{}};keys.forEach(key=>{const value=localStorage.getItem(key);if(value!==null)snapshot.localStorage[key]=value;});const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`oppurtune-local-backup-${Date.now()}.json`;link.click();URL.revokeObjectURL(url);}
function migrationCategoryHtml(label,items,count=items.length){return `<p><b>${safe(label)}:</b> ${safe(count)}</p>${items.length?`<ul>${items.slice(0,20).map(item=>`<li>${safe(item.reference||item.legacyId||"(no legacy ID)")}: ${safe(item.reason||item.classification||"Matched")}</li>`).join("")}</ul>${items.length>20?`<p>Showing 20 of ${items.length} records.</p>`:""}`:""}`;}
function migrationPreviewHtml(result){const groups=result.records||{};return `<p><b>Legacy totals:</b> ${Object.entries(result.counts||{}).map(([type,total])=>`${safe(type)} ${safe(total)}`).join(" · ")}</p><p><b>Users matched:</b> ${safe(result.users?.matched||0)} · <b>Unmatched:</b> ${safe(result.users?.unresolved||0)}</p><p><b>Safe to import:</b> ${safe(result.summary?.safeToImport||0)} · <b>Duplicate candidates:</b> ${safe(result.summary?.duplicateCandidates||0)} · <b>Unmatched:</b> ${safe(result.summary?.unmatched||0)} · <b>Unresolved:</b> ${safe(result.summary?.unresolved||0)} · <b>Requires manual review:</b> ${safe(result.summary?.requiresManualReview||0)}</p>${Object.entries(groups).map(([type,group])=>`<details><summary>${safe(type)} (${safe(group.total)} total): ${safe(group.safeToImportCount)} safe, ${safe(group.duplicateCandidateCount)} duplicate, ${safe(group.unmatchedCount)} unmatched, ${safe(group.unresolvedCount)} unresolved, ${safe(group.manualReviewCount)} manual review</summary>${migrationCategoryHtml("Safe to import",group.safeToImport,group.safeToImportCount)}${migrationCategoryHtml("Duplicate candidates",group.duplicateCandidates,group.duplicateCandidateCount)}${migrationCategoryHtml("Unmatched",group.unmatched,group.unmatchedCount)}${migrationCategoryHtml("Unresolved references / records",group.unresolved,group.unresolvedCount)}${migrationCategoryHtml("Requires manual review",group.manualReview,group.manualReviewCount)}</details>`).join("")}<p>${safe(result.warning)}</p>`;}
async function previewMigration(){try{downloadLegacyBackup();legacyBackup=migrationData();const result=await api("/api/admin/migration/preview",{method:"POST",body:jsonBody({data:legacyBackup})});document.getElementById("migrationReport").innerHTML=migrationPreviewHtml(result);}catch(error){alert(error.message);}}
async function importMigration(){if(!legacyBackup){alert("Run the backup and preview first.");return;}if(!confirm("Import matched legacy records into MongoDB? Existing localStorage data will remain unchanged."))return;try{const {report}=await api("/api/admin/migration/import",{method:"POST",body:jsonBody({data:legacyBackup})});const summary=Object.entries(report).map(([type,r])=>`${type}: imported ${r.imported}, matched ${r.matched}, duplicate ${r.duplicate}, skipped ${r.skipped}, unresolved ${r.unresolved.length}`).join(" · ");document.getElementById("migrationReport").innerHTML=`<p>${safe(summary)}</p><details><summary>Unresolved record details</summary><pre>${safe(JSON.stringify(Object.fromEntries(Object.entries(report).map(([k,v])=>[k,v.unresolved])),null,2))}</pre></details>`;}catch(error){alert(error.message);}}

if(current())openDashboard();else showPage("home");
renderProjects();
