import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

//console.log('Let\'s go!');

let authToken = null;
let authUserId = null;
var currentPageNumber = 0;
const feedPerPage = 5;
let myFile = null;
let endOfFeed = false;

const apiCall = (path, method, body, callback) => {

    return new Promise((resolve, reject) => {
        const init = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: (path === 'auth/register' || 'auth/login' ? authToken : undefined),
            },
            body: method === 'GET' ? undefined : JSON.stringify(body),
        }
    
        fetch(`http://localhost:${BACKEND_PORT}/${path}`, init)
            .then(response => response.json())
            .then(body => {
                if (body.error) {
                    path === 'auth/login' ? loginFailedAlert() : alert(body.error);
                } else {
                    resolve(body);
                }
        });

    });

}


const register = (email, password, name) => {
    return apiCall(`auth/register`, 'POST', {
        email,
        password,
        name,
    });

}

const login = (email, password) => {
    return apiCall(`auth/login`, 'POST', {
        email,
        password,
    });
    
}

const getProfile = (userId) => {
    // GET request params sent through link, can send empty query
    return apiCall(`user?userId=${userId}`, 'GET', {});
}

const getJobFeed = (start) => {
    return apiCall(`job/feed?start=${start}`, 'GET', {});
}

const likeJob = (postId, status) => {
    return apiCall(`job/like`, 'PUT', {
        id: postId,
        turnon: status,
    });
}

const updateUser = (email, password, name, image) => {
    return apiCall(`user`, 'PUT', {
        email,
        password,
        name,
        image
    });
}

const updateWatch = (email, status) => {
    return apiCall(`user/watch`, 'PUT', {
        'email': email,
        'turnon': status
    });
}

const addJobListing = (title, image, start, description) => {
    return apiCall(`job`, 'POST', {
        title,
        image,
        start,
        description
    });
}

const updateJobListing = (id, title, image, start, description) => {
    return apiCall(`job`, 'PUT', {
        id,
        title,
        image,
        start,
        description
    });
}

const deleteJobListing = (id) => {
    return apiCall(`job`, 'DELETE', {
        id
    });
}

const addJobComment = (id, comment) => {
    return apiCall(`job/comment`, 'POST', {
        id,
        comment
    });
}


document.getElementById('btn-register').addEventListener('click', () => {
    // console.log("registering account")
    const registerEmail = document.getElementById('register-email').value;
    const registerPassword = document.getElementById('register-password').value;
    const registerPasswordConfirm = document.getElementById('register-confirm-password').value;
    const registerName = document.getElementById('register-name').value;

    if (registerPassword !== registerPasswordConfirm) {
        document.getElementById('password-failed-popup').style.display="block";
        return;
    }

    register(registerEmail, registerPassword, registerName).then((body) => {
        authToken = body.token;
        authUserId = body.userId;
        gotoScreenWelcome();
    });
});

document.getElementById('btn-login').addEventListener('click', () => {
    const loginEmail = document.getElementById('login-email').value;
    const loginPassword = document.getElementById('login-password').value;

    login(loginEmail, loginPassword).then((body) => {
        authToken = body.token;
        authUserId = body.userId;
        gotoFeedPage();
        
    });
});


const gotoScreenRegister = () => {
    document.getElementById('register-screen').style.display="block";
    document.getElementById('login-screen').style.display="none";
    closeAlert();
}

const gotoScreenLogin = () => {
    document.getElementById('register-screen').style.display="none";
    document.getElementById('login-screen').style.display="block";
    closeAlert();
}

const gotoFeedScreen = () => {
    document.getElementById('register-screen').style.display="none";
    document.getElementById('login-screen').style.display="none";
    document.getElementById('center').style.display="none";
    document.getElementById('job-feed-screen').style.display="flex";
    closeAlert();
}

// Automatically goes into the job feed section
const gotoScreenWelcome = () => {
    getProfile(authUserId).then((body) => {
        //console.log(`body is from getProfile ${JSON.stringify(body)}`);
        gotoFeedScreen();
    })
}

const gotoFeedPage = () => {

    currentPageNumber = 0;
    endOfFeed = false;
    closeProfile();
    
    clearContainers(`job-feed-screen`);

    getJobFeed(currentPageNumber * feedPerPage).then((body) => {


        body.slice(0, feedPerPage).map((item) => constructFeedInput(item));

        document.getElementById('register-screen').style.display="none";
        document.getElementById('login-screen').style.display="none";
        document.getElementById('center').style.display="none";
        document.getElementById('job-feed-screen').style.display="flex";

        if (body.length === 0) {

            endOfFeed = true;
            // if (currentPageNumber != 0) {
            //     movePage('left');
            // }
            return;
        }

    });
}

const buildOnFeedPage = () => {

    getJobFeed(currentPageNumber * feedPerPage).then((body) => {

        body.slice(0, feedPerPage).map((item) => constructFeedInput(item));

        if (body.length === 0) {

            endOfFeed = true;
            // if (currentPageNumber != 0) {
            //     movePage('left');
            // }
            return;
        }

    });
}

const loginFailedAlert = () => {
    document.getElementById('login-failed-popup').style.display="block";
}

const closeAlert = () => {
    document.getElementById('login-failed-popup').style.display="none";
    document.getElementById('password-failed-popup').style.display="none";
}



const returnDate = (date, type) => {

    try {
        const currentTime = new Date();
        const laterTime = new Date(date);

        const msBetweenDates = Math.abs(currentTime.getTime() - laterTime.getTime());
        const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000);

        if (hoursBetweenDates > 24 || type === 'start') {
            return `${laterTime.getUTCDate()}/${laterTime.getUTCMonth() + 1}/${laterTime.getUTCFullYear()}`;
        } else {
            const fullHour = Math.floor(hoursBetweenDates);
            const remainingMinutes = Math.round(Math.abs(hoursBetweenDates - fullHour)*60);
            return `${fullHour}Hr ${remainingMinutes}Min Ago`;
        }
    } catch (err) {
        return 'null';
    }
        
}




const constructFeedInput = (body) => {

    gotoFeedScreen();

    const feedContainer = document.createElement('div');
    feedContainer.setAttribute('class', 'feed-container');

    const label = document.createElement('h2');
    label.setAttribute('for', 'jobFeedInput');
    label.setAttribute('class', 'form-label');
    label.innerText = body.title;
    label.style.marginBottom = '4pt';
    label.style.marginTop = '0pt';

    // need to do hours within 24hrs, or days more than 24hrs
    const timestamp = document.createElement('p');
    timestamp.innerText = `Created at: ` + returnDate(body.createdAt, 'create');
    timestamp.style.fontSize = '8pt';

    const startDate = document.createElement('p');
    startDate.innerText = `Start Date: ` + returnDate(body.start, 'start');
    startDate.style.fontSize = '8pt';

    // image
    const image = document.createElement('img');
    image.setAttribute("src", body.image)
    image.style.width = `100%`;
    image.style.height = `100%`;

    // description
    const description = document.createElement('label');
    description.innerText = body.description;

    // new lines
    const newLine = document.createElement('br');
    const newLine2 = document.createElement('br');

    // comment box
    const comment = document.createElement('input');
    comment.setAttribute('type', 'text');
    comment.setAttribute('class', 'form-control');
    comment.setAttribute('placeholder', 'Your comment here');
    comment.style.width = '100%';

    /////////////////////////////////////////////////////////////////////////////////////////
    // like and comment buttons
    const reactContainer = document.createElement('div');
    reactContainer.setAttribute('class', 'react-container');

    // like and comment status
    const reactInfo = document.createElement('div');
    reactInfo.setAttribute('class', 'react-info-container');

    const numberofLikes = document.createElement('a');
    numberofLikes.innerText = (body.likes.length + ' likes');
    //numberofLikes.style.margin = 'auto';

    const numberofComments = document.createElement('a');
    numberofComments.innerText = (body.comments.length + ' comments');
    //numberofComments.style.margin = 'auto';

    reactInfo.appendChild(numberofLikes);
    reactInfo.appendChild(numberofComments);

    reactInfo.style.display = 'flex';
    reactInfo.style.flexDirection = 'row';
    reactInfo.style.gap = '10pt';
    reactInfo.style.justifyContent = 'space-between';

    // like and commend buttons
    const reactButtons = document.createElement('div');
    reactButtons.setAttribute('class', 'react-buttons-container');

    const thumbsIcon = document.createElement('button');

    // start up, check if liked before or not
    thumbsIcon.innerText = checkPrevLiked(body.likes) === true ? 'Unlike' : 'Like';

    thumbsIcon.setAttribute("id", `thumbsup?${body.id}`);
    thumbsIcon.setAttribute("src", '/img/thumbsup.svg');
    thumbsIcon.style.width = 'auto';
    thumbsIcon.style.height = 'auto';

    const commentIcon = document.createElement('button');
    commentIcon.innerText = 'Comment';
    commentIcon.setAttribute("id", `comment?${body.id}`);
    commentIcon.setAttribute("src", '/img/comment.svg');
    commentIcon.style.width = 'auto';
    commentIcon.style.height = 'auto';

    reactButtons.appendChild(thumbsIcon);
    reactButtons.appendChild(commentIcon);

    reactButtons.style.display = 'flex';
    reactButtons.style.flexDirection = 'row';
    reactButtons.style.gap = '10pt';
    reactButtons.style.justifyContent = 'space-around';

    reactButtons.style.margin = '1px solid black';


    /////////////////////////////////////////////////////////////////////////////////////////

    // styling
    reactContainer.style.display = 'flex';
    reactContainer.style.flexDirection = 'row';
    reactContainer.style.justifyContent = 'space-evenly';
    reactContainer.style.marginTop = '1px solid black';
    reactContainer.style.padding = '10px';

    feedContainer.style.backgroundColor = 'white';
    feedContainer.style.padding = '20pt';
    feedContainer.style.borderRadius = '20pt';
    feedContainer.style.marginBottom = '1px solid black';

    getProfile(body.creatorId).then((profile) => {
        //console.log(`body is from getProfile ${JSON.stringify(profile)}`);

        const profilePic = document.createElement('img');
        profilePic.setAttribute('class', 'feed-profile-pic');

        if (profile.image === "" || profile.image === undefined) {
            profilePic.setAttribute("src", '/img/profile1.svg');
        } else {
            profilePic.setAttribute("src", profile.image);
        }

        const profileName = document.createElement('a');
        profileName.innerText = profile.name;

        const profileContainer = document.createElement('div');
        profileContainer.setAttribute('class', 'feed-profile-container');
        profileContainer.appendChild(profilePic);
        profileContainer.appendChild(profileName);


        feedContainer.appendChild(profileContainer);
        feedContainer.appendChild(label);
        feedContainer.appendChild(timestamp);
        feedContainer.appendChild(startDate);
        feedContainer.appendChild(image);
        feedContainer.appendChild(newLine);
        feedContainer.appendChild(description);
        feedContainer.appendChild(newLine2);
        feedContainer.appendChild(reactInfo);
        feedContainer.appendChild(reactButtons);
        //feedContainer.appendChild(reactContainer);
        feedContainer.appendChild(document.createElement('br'));
        feedContainer.appendChild(comment);
        feedContainer.appendChild(document.createElement('br'));

        profileName.addEventListener('click', () => {
            showProfile(profile.id);
        });

        commentIcon.addEventListener('click', () => {
            // TODO:
            addComment(body.id, feedContainer);
        });

        //console.log(`authID is ${authUserId} and looking at ${body.creatorId}`)

        if (authUserId === body.creatorId) {
            const editBtn = document.createElement('a');
            editBtn.innerText = 'Edit Post'
            const deleteBtn = document.createElement('a');
            deleteBtn.innerText = 'Delete Post'

            const bottomActionContainer = document.createElement('div');
            bottomActionContainer.style.display = 'flex';
            bottomActionContainer.style.flexDirection = 'row';
            bottomActionContainer.style.justifyContent = 'flex-start';
            bottomActionContainer.style.gap = '20pt';
            
            bottomActionContainer.appendChild(editBtn);
            bottomActionContainer.appendChild(deleteBtn);

            feedContainer.appendChild(bottomActionContainer);
    
            deleteBtn.addEventListener('click', () => {
                deletePost(body.id);
            })

            editBtn.addEventListener('click', () => {
                showJobTemplatePopup(body.id);
            })

            // create listener for edit post here
            
        }
          

    }); 

    
    feedContainer.style.margin = '1px solid black';
    
    document.getElementById('job-feed-screen').appendChild(feedContainer);

    // Like button function
    thumbsIcon.addEventListener('click', () => {

        if (thumbsIcon.innerText === 'Like') {
            likeJob(body.id, true);
            thumbsIcon.innerText = 'Unlike';
        } else {
            likeJob(body.id, false);
            thumbsIcon.innerText = 'Like';
        }

    }, false);

    // Display all likes
    numberofLikes.addEventListener('click', () => {
        showAllReactionPopup(body.likes, 'likes');
    });

    // Display all comments
    numberofComments.addEventListener('click', () => {
        showAllReactionPopup(body.comments, 'comments');
    });
    //console.log(feedContainer.innerHTML);

}

const addComment = (postId, container) => {
    
    const inputs = container.querySelectorAll('input');
    //console.log(`${JSON.stringify(inputs[0].value)} postid: ${postId}`)

    addJobComment(postId, inputs[0].value);

    inputs[0].value = "";
    
}


const deletePost = (postId) => {
    deleteJobListing(postId);
    gotoFeedPage();
}

const showProfile = (profileId) => {

    closePopup();
    clearContainers('popup-message-content');
    clearContainers(`job-feed-screen`);
    removeDuplicatePopupListeners(`show-profile`);
    //hideBottomNavigator();
    

    getProfile(profileId).then((body) => {
        //console.log(body);
        
        document.getElementById('show-profile').style.display = 'block';

        if (body.image === "" || body.image === undefined) {
            document.getElementById('profile-img').setAttribute("src", '/img/profile1.svg');
        } else {
            document.getElementById('profile-img').setAttribute("src", body.image);
        }
        
        document.getElementById('show-profile-name').innerText = body.name;
        document.getElementById('personal-id').innerText = `User ID: ${body.id}`;
        document.getElementById('personal-email').innerText = `Email: ${body.email}`;

        const followButton = document.getElementById('profile-follow-button');
        followButton.innerText = (
            checkIfFollowing(body.watcheeUserIds, authUserId) === true ? `Unfollow` : `Follow`
        );
        
        // showing edit profile button
        profileId === authUserId ? displayEditProfileButton('block') : displayEditProfileButton('none');

        // Event listeners for all the followers present
        document.getElementById('profile-followers').innerText = 'Followers: ' + getAllFollowers(body.watcheeUserIds);

        for (var i = 0; i < body.jobs.length; i++) {
            constructFeedInput(body.jobs[i]);
        }

        //TODO: if length is 0, need to hide center

        document.getElementById('profile-followers').addEventListener('click', () => {
            showAllFollowersPopup(body.watcheeUserIds);
        })

        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            showEditProfilePopup(authUserId);
        })

        followButton.addEventListener('click', () => {
            followProfile(body.email, followButton.innerText, followButton);
        })
    })

}

const followProfile = (email, status, button) => {

    var callStatus = false;

    if (status === "Follow") {
        button.innerText = "Unfollow";
        callStatus = true;
    } else if (status === "Unfollow") {
        button.innerText = "Follow";
        callStatus = false;
    }

    updateWatch(email, callStatus);
}

///////////////////////////////////////////////////////////////////////////////

const viewOwnProfile = () => {
    showProfile(authUserId);
}

const displayEditProfileButton = (cmd) => {
    removeDuplicatePopupListeners("edit-profile-btn");
    document.getElementById('edit-profile-btn').style.display = cmd;
}

const closePopup = () => {
    removeDuplicatePopupListeners("popup-message-content");
    popupBox.style.display = 'none';
    clearContainers('popup-message-content');
}

const clearContainers = (location) => {
    const contentContainer = document.getElementById(`${location}`);
    while (contentContainer.firstChild) {
        contentContainer.removeChild(contentContainer.firstChild);
    }
}

const closeProfile = () => {
    document.getElementById('show-profile').style.display = 'none';
}


///////////////////////////////////////////////////////////////////////////////

// givenList, 'likes' || 'comments'
const showAllReactionPopup = (givenList, type) => {
    popupBox.style.display = 'block';
    const title = document.getElementById('popup-title');
    title.innerText = type === 'likes' ? 'Likes' : 'Comments';
    //clearContainers('popup-message-content');
    const contentContainer = document.getElementById('popup-message-content');

    //console.log(givenList);

    for (const item in givenList) {
        const content = document.createElement('a');
        content.innerText = type === 'likes' ? `${givenList[item].userName}` : `${givenList[item].userName}: ${givenList[item].comment}`;
        
        content.addEventListener('click', () => {
            showProfile(givenList[item].userId);
        });

        //console.log(content)
        contentContainer.appendChild(content);
        contentContainer.appendChild(document.createElement('br'));
    }
    
}

const showAllFollowersPopup = (followerList) => {
    popupBox.style.display = 'block';
    const title = document.getElementById('popup-title');
    title.innerText = `Followers`;
    clearContainers('popup-message-content');

    // Removing the listeners/recursive behaviour
    //////////////////////////////////////////////////////////////////////////////////
    removeDuplicatePopupListeners("popup-message-content");
    //////////////////////////////////////////////////////////////////////////////////

    const contentContainer = document.getElementById('popup-message-content');

    //console.log(`running showAllFollowersPopup!!!!!`);
    //console.log(followerList);

    for (const follower in followerList) {
        
        getProfile(followerList[follower]).then((profile) => {
            //console.log(`wut profile: ${JSON.stringify(profile)}`)
            const content = document.createElement('a');
            content.innerText = `${profile.name}: ${getAllFollowers(profile.watcheeUserIds)} Followers`
            contentContainer.appendChild(content);
            contentContainer.appendChild(document.createElement('br'));

            content.addEventListener('click', () => {
                showProfile(profile.id);
            });

        });
    }

}

// TODO:
const checkIfFollowing = (followerList, viewedProfileId) => {

    //console.log(`looking at ${followerList} and ${viewedProfileId}`)
    
    for (const follower in followerList) {
        //console.log(followerList[follower].userId + viewedProfileId)
        //console.log(follower);
        if (followerList[follower] === viewedProfileId) {
            return true;
        }
    }

    return false;
}


const checkPrevLiked = (likeList) => {
    for (const item in likeList) {
        //console.log(`${item}: ${JSON.stringify(likeList[item])}}`)
        if (likeList[item].userId === authUserId) {
            //console.log(`overall did like`);
            return true;
        } else {
            //console.log(`this is false`);
        }
    }
    //console.log(`overall did not like`)
    return false;
}

///////////////////////////////////////////////////////////////////////////////

const getAllFollowers = (followerList) => {
    //console.log(`running getAllFollowers`)
    var count = 0;
    for (const follower in followerList) {
        count++;
    }
    return count;
}

///////////////////////////////////////////////////////////////////////////////

const removeDuplicatePopupListeners = (destination) => {
    var old_element = document.getElementById(destination);
    var new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);
}

const showEditProfilePopup = (userId) => {
    
    clearContainers('popup-edit-content');
    editPopupBox.style.display = 'block';


    getProfile(userId).then((profile) => {

        const editContainer = document.getElementById('popup-edit-content');

        document.getElementById('edit-title').innerText = 'Edit Profile';

        // email label
        const emailLabel = document.createElement('label');
        emailLabel.setAttribute('for', 'edit-email-input');
        emailLabel.innerText = 'Email Address: ';
        // email box
        const emailInput = document.createElement('input');
        emailInput.setAttribute('type', 'email');
        emailInput.setAttribute('id', 'edit-email-input');
        emailInput.setAttribute('class', 'form-control');
        emailInput.setAttribute('placeholder', 'Your email here');
        //emailInput.setAttribute('value', `${profile.email}`);

        // password label
        const passwordLabel = document.createElement('label');
        passwordLabel.setAttribute('for', 'edit-password-input');
        passwordLabel.innerText = 'Password: ';
        // password box
        const passwordInput = document.createElement('input');
        passwordInput.setAttribute('type', 'password');
        passwordInput.setAttribute('id', 'edit-password-input');
        passwordInput.setAttribute('class', 'form-control');
        passwordInput.setAttribute('placeholder', 'Your new password here');

        // name label
        const nameLabel = document.createElement('label');
        nameLabel.setAttribute('for', 'edit-name-input');
        nameLabel.innerText = 'Name: ';
        // name box
        const nameInput = document.createElement('input');
        nameInput.setAttribute('type', 'text');
        nameInput.setAttribute('id', 'edit-name-input');
        nameInput.setAttribute('class', 'form-control');
        nameInput.setAttribute('placeholder', 'Your name here');
        nameInput.setAttribute('value', `${profile.name}`);

        // image label
        const imageLabel = document.createElement('label');
        imageLabel.setAttribute('for', 'edit-image-input');
        imageLabel.innerText = 'New Image Here: ';
        // image box
        const imageInput = document.createElement('input');
        imageInput.setAttribute('type', 'file');
        imageInput.setAttribute('id', 'edit-image-input');
        imageInput.setAttribute('class', 'form-control');
        imageInput.setAttribute('placeholder', 'Your base64 image here');

        editContainer.appendChild(emailLabel);
        editContainer.appendChild(emailInput);
        editContainer.appendChild(document.createElement('br'));
        editContainer.appendChild(passwordLabel);
        editContainer.appendChild(passwordInput);
        editContainer.appendChild(document.createElement('br'));
        editContainer.appendChild(nameLabel);
        editContainer.appendChild(nameInput);
        editContainer.appendChild(document.createElement('br'));
        editContainer.appendChild(imageLabel);
        editContainer.appendChild(imageInput);

        const fileInput = document.getElementById('edit-image-input');

        fileInput.addEventListener('change', (event) => {
            //processImageBase64(event, 'edit-image-input');
            try {
                fileToDataUrl(event.srcElement.files[0]).then((imageData) => {
                    myFile = imageData;
                    //console.log(`${imageData}`);
                })
            } catch (err) {
                alert(`${err} File will not be uploaded when submitted.`)
            }

        })

        // TEST, may remove
        document.getElementById('submit-edit-btn').addEventListener('click', submitEditPopup);

    }); 
    
}

const showAddSomeonePopup = () => {

    clearContainers('popup-edit-content');
    
    editPopupBox.style.display = 'block';

    document.getElementById('edit-title').innerText = 'Add Someone';

    const editContainer = document.getElementById('popup-edit-content');

    // email label
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'edit-email-input');
    emailLabel.innerText = 'Add Someone Here: ';
    // email box
    const emailInput = document.createElement('input');
    emailInput.setAttribute('type', 'email');
    emailInput.setAttribute('id', 'edit-email-input');
    emailInput.setAttribute('class', 'form-control');
    emailInput.setAttribute('placeholder', 'Their email address');

    editContainer.appendChild(emailLabel);
    editContainer.appendChild(emailInput);

    document.getElementById('submit-edit-btn').addEventListener('click', () => {
        submitAddSomeonePopup();
    });

}

///////////////////////////////////////////////////////////////////////////////

const submitAddSomeonePopup = () => {

    editPopupBox.style.display = 'none';

    const editContainer = document.getElementById('popup-edit-content');

    const myStuff = editContainer.querySelectorAll('input');

    //console.log(JSON.stringify(myStuff));

    myStuff[0].value !== undefined ? updateWatch(myStuff[0].value, true) : alert(`Please enter a valid email`);

    removeDuplicatePopupListeners("submit-edit-btn");
    clearContainers('popup-edit-content');
    
}

const showJobTemplatePopup = (postId) => {

    clearContainers('popup-edit-content');
    editPopupBox.style.display = 'block';

    const editContainer = document.getElementById('popup-edit-content');

    if (postId === '') {
        document.getElementById('edit-title').innerText = 'Add New Job';
    } else {
        document.getElementById('edit-title').innerText = 'Edit Job';
    }
    
    // title label
    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'job-title-input');
    titleLabel.innerText = 'Title: ';
    // title box
    const titleInput = document.createElement('input');
    titleInput.setAttribute('type', 'text');
    titleInput.setAttribute('id', 'job-title-input');
    titleInput.setAttribute('class', 'form-control');
    titleInput.setAttribute('placeholder', 'Your title here');
    //emailInput.setAttribute('value', `${profile.email}`);

    // image label
    const jobImageLabel = document.createElement('label');
    jobImageLabel.setAttribute('for', 'job-image-input');
    jobImageLabel.innerText = 'New Image Here: ';
    // image box
    const jobImageInput = document.createElement('input');
    jobImageInput.setAttribute('type', 'file');
    jobImageInput.setAttribute('id', 'job-image-input');
    jobImageInput.setAttribute('class', 'form-control');
    jobImageInput.setAttribute('placeholder', 'Your base64 image here');

    // start label
    const startLabel = document.createElement('label');
    startLabel.setAttribute('for', 'job-start-input');
    startLabel.innerText = 'Start Date: ';
    // start box
    const startInput = document.createElement('input');
    startInput.setAttribute('type', 'datetime-local');
    startInput.setAttribute('id', 'job-start-input');
    startInput.setAttribute('class', 'form-control');
    startInput.setAttribute('placeholder', 'Start date here');

    // description label
    const descriptionLabel = document.createElement('label');
    descriptionLabel.setAttribute('for', 'job-description-input');
    descriptionLabel.innerText = 'Description: ';
    // description box
    const descriptionInput = document.createElement('input');
    descriptionInput.setAttribute('type', 'text');
    descriptionInput.setAttribute('id', 'job-description-input');
    descriptionInput.setAttribute('class', 'form-control');
    descriptionInput.setAttribute('placeholder', 'Your description here');

    editContainer.appendChild(titleLabel);
    editContainer.appendChild(titleInput);
    editContainer.appendChild(document.createElement('br'));
    editContainer.appendChild(jobImageLabel);
    editContainer.appendChild(jobImageInput);
    editContainer.appendChild(document.createElement('br'));
    editContainer.appendChild(startLabel);
    editContainer.appendChild(startInput);
    editContainer.appendChild(document.createElement('br'));
    editContainer.appendChild(descriptionLabel);
    editContainer.appendChild(descriptionInput);

    const fileInput = document.getElementById('job-image-input');

    fileInput.addEventListener('change', (event) => {
        //processImageBase64(event, 'job-image-input');

        // testing here
        //var inputKey = fileInput.getAttribute('name')
        //var files = event.srcElement.files
        
        //console.log(`${JSON.stringify(event.srcElement.files[0])}`)
        try {
            fileToDataUrl(event.srcElement.files[0]).then((imageData) => {
                myFile = imageData;
                //console.log(`${imageData}`);
            })
        } catch (err) {
            alert(`${err} File will not be uploaded when submitted.`)
        }
        
    })

    // TEST, may remove
    document.getElementById('submit-edit-btn').addEventListener('click', () => {
        submitJob(postId);
    });
    
}

const submitJob = (postId) => {
    editPopupBox.style.display = 'none';

    const editContainer = document.getElementById('popup-edit-content');

    var myStuff = editContainer.querySelectorAll('input');

    // var image = "";
    // Object.keys(myFile).length !== 0 ? image = myFile.null : image = "";

    var date = "";
    myStuff[2].value !== "" ? date = myStuff[2].value + ':00.000Z' : date = "";

    if (postId === '') {
        addJobListing(myStuff[0].value, myFile, date, myStuff[3].value).then((jobId) => {
            //console.log(`jobId`);
            //constructFeedInput(jobId);
            viewOwnProfile();
        });
    } else {
        // edit job listing here
        //console.log(`we edit this biccccch jobid: ${postId}`)
        updateJobListing(postId, myStuff[0].value, myFile, date, myStuff[3].value).then((jobId) => {
            viewOwnProfile();
            // adding the job that you've just created to wherever
            //constructFeedInput(jobId);
        });
    }

    myFile = null;

    removeDuplicatePopupListeners("submit-edit-btn");
    clearContainers('popup-edit-content');
}

const submitEditPopup = () => {
    // lets make this a submit function

    editPopupBox.style.display = 'none';

    const editContainer = document.getElementById('popup-edit-content');

    const myStuff = editContainer.querySelectorAll('input');

    //var image = "";
    //Object.keys(myFile).length !== 0 ? image = myFile.null : image = "";

    // ok this works
    //console.log(`${JSON.stringify(myStuff)}`);

    updateUser(myStuff[0].value, myStuff[1].value, myStuff[2].value, myFile).then(() => {
        alert(`information has been succesfully updated!`)
    })

    //removeDuplicatePopupListeners("popup-edit-content");
    myFile = null;
    removeDuplicatePopupListeners("submit-edit-btn");
    clearContainers('popup-edit-content');
    
}

const cancelEditPopup = () => {

    editPopupBox.style.display = 'none';
    clearContainers('popup-edit-content');
    removeDuplicatePopupListeners("submit-edit-btn");

}


// Pagination Functions: 
// const movePage = (direction) => {
    
//     if (direction === `left`) {
//         // check if negative, then can not do
//         if (currentPageNumber < 1) {
//             alert(`Can not go further back`);
//         } else {
//             currentPageNumber--;
//         }
//     } else if (direction === `right`) {
//         currentPageNumber++;
//     }

//     document.getElementById('current-page-number').innerText = currentPageNumber + 1;
//     gotoFeedPage();

// }

// const hideBottomNavigator = () => {
//     document.getElementById('pagination-btn-container').style.display = 'none';
// }

// const showBottomNavigator = () => {
//     document.getElementById('pagination-btn-container').style.display = 'flex';
// }

const popupBox = document.querySelector('.popup-overlay');
const editPopupBox = document.getElementById('edit-overlay');

const mainMenu = document.querySelector('.nav-links');
const closeMenu = document.querySelector('.close-menu')
const openMenu = document.querySelector('.open-menu')

document.getElementById('btn-signup-form').addEventListener('click', gotoScreenRegister);
document.getElementById('btn-login-form').addEventListener('click', gotoScreenLogin);
document.getElementById('close-btn1').addEventListener('click', closeAlert);
document.getElementById('close-btn2').addEventListener('click', closeAlert);
document.getElementById('done-btn').addEventListener('click', closePopup);

document.getElementById('cancel-edit-btn').addEventListener('click', cancelEditPopup);
//document.getElementById('submit-edit-btn').addEventListener('click', submitEditPopup);

document.getElementById('own-profile').addEventListener('click', viewOwnProfile);
document.getElementById('feed-btn').addEventListener('click', () => {
    // this should reset the end of page
    
    closeHamElement();
    //document.getElementById('current-page-number').innerText = currentPageNumber + 1;
    gotoFeedPage();
});
document.getElementById('add-someone-btn').addEventListener('click', () => {
    closeHamElement();
    showAddSomeonePopup();
});

document.getElementById('add-job-btn').addEventListener('click', () => {
    closeHamElement();
    showJobTemplatePopup('');
});

// Pagination listeners
// document.getElementById('arrow-left').addEventListener('click', () => {
//     movePage(`left`);
// });
// document.getElementById('arrow-right').addEventListener('click', () => {
//     movePage(`right`);
// });

const displayHamElement = () => {
    mainMenu.style.display = 'flex';
    mainMenu.style.top = '0';
}

const closeHamElement = () => {
    mainMenu.style.top = '-120%';
}

openMenu.addEventListener('click', displayHamElement);
closeMenu.addEventListener('click', closeHamElement);

window.addEventListener('scroll', () => {
    //console.log(window.scrollY);
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
        if (endOfFeed === false) {
            currentPageNumber++;
            buildOnFeedPage();
        }
    }
});