const STORAGE_KEY = 'portfolioEditableContentV2';
let projects = [];
let isEditEnabled = false;

function createSafeLink(url) {
    if (!url || url.trim() === '') return '#';
    return url.trim();
}

function saveContentToStorage() {
    const payload = {
        projects,
        personalInfoHTML: document.getElementById('personal-info')?.innerHTML || '',
        educationInfoHTML: document.getElementById('education-info')?.innerHTML || '',
        achievementsHTML: document.getElementById('achievements-list')?.innerHTML || ''
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function normalizeCollegeLink() {
    const collegeLink = Array.from(document.querySelectorAll('#education-info a')).find(link =>
        link.textContent.trim().includes('Biliran Province State University')
    );
    if (collegeLink) {
        collegeLink.href = 'https://bipsu.edu.ph/index.php/about-us/the-university';
        collegeLink.target = '_blank';
        collegeLink.rel = 'noopener noreferrer';
    }
}

function loadContentFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const saved = JSON.parse(raw);
        projects = Array.isArray(saved.projects) ? saved.projects : [];
        if (saved.personalInfoHTML) document.getElementById('personal-info').innerHTML = saved.personalInfoHTML;
        if (saved.educationInfoHTML) document.getElementById('education-info').innerHTML = saved.educationInfoHTML;
        if (saved.achievementsHTML) document.getElementById('achievements-list').innerHTML = saved.achievementsHTML;
        normalizeCollegeLink();
        saveContentToStorage();
    } catch (error) {
        console.error('Unable to load saved content:', error);
    }
}

function renderProjects() {
    const projectGrid = document.getElementById('project-grid');
    const emptyState = document.getElementById('project-empty-state');
    if (!projectGrid || !emptyState) return;

    projectGrid.innerHTML = '';
    if (projects.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project';
        card.innerHTML = `
            <div class="project-image">
                ${project.image ? `<img src="${project.image}" alt="${project.title}" class="project-photo">` : '<div class="image-placeholder">Project Image</div>'}
            </div>
            <h3>${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">${project.tech.map(item => `<span>${item}</span>`).join('')}</div>
            <div class="project-links">
                <a href="${createSafeLink(project.demo)}" class="project-link" target="_blank" rel="noopener noreferrer">Live Demo</a>
                <a href="${createSafeLink(project.github)}" class="project-link" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <div class="inline-actions card-actions">
                <button type="button" class="feature-btn" data-project-edit="${index}">Edit</button>
                <button type="button" class="feature-btn danger-btn" data-project-delete="${index}">Delete</button>
            </div>
        `;
        projectGrid.appendChild(card);
    });
}

function closeAllInlineForms() {
    document.querySelectorAll('.inline-form').forEach(form => {
        form.style.display = 'none';
    });
}

function disableAllEditableBlocks() {
    const editBlocks = [
        { buttonId: 'edit-personal-btn', containerId: 'personal-info' },
        { buttonId: 'edit-education-btn', containerId: 'education-info' },
        { buttonId: 'edit-achievements-btn', containerId: 'achievements-list' }
    ];

    editBlocks.forEach(({ buttonId, containerId }) => {
        const button = document.getElementById(buttonId);
        const container = document.getElementById(containerId);
        if (container) {
            container.contentEditable = 'false';
            container.classList.remove('editable-active');
        }
        if (button) {
            button.textContent = 'Edit';
            button.dataset.editing = 'false';
        }
    });
}

function setEditEnabled(enabled) {
    isEditEnabled = enabled;
    document.body.classList.toggle('edit-enabled', isEditEnabled);
    const toggleButton = document.getElementById('toggle-edit-visibility');
    if (toggleButton) {
        toggleButton.textContent = isEditEnabled ? 'Disable Edit' : 'Enable Edit';
    }

    if (!isEditEnabled) {
        closeAllInlineForms();
        disableAllEditableBlocks();
    }
}

function setupEditableBlock(buttonId, containerId) {
    const button = document.getElementById(buttonId);
    const container = document.getElementById(containerId);
    if (!button || !container) return;

    button.addEventListener('click', () => {
        if (!isEditEnabled) return;

        const isCurrentlyEditing = button.dataset.editing === 'true';
        const editing = !isCurrentlyEditing;
        button.dataset.editing = editing ? 'true' : 'false';
        container.contentEditable = editing ? 'true' : 'false';
        container.classList.toggle('editable-active', editing);
        button.textContent = editing ? 'Save' : 'Edit';
        if (!editing) saveContentToStorage();
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('.info-link[href="#"], .project-link[href="#"]')) {
        event.preventDefault();
    }

    const editIndex = target.getAttribute('data-project-edit');
    if (editIndex !== null) {
        if (!isEditEnabled) return;
        const index = Number(editIndex);
        const project = projects[index];
        if (!project) return;

        const title = prompt('Project title:', project.title);
        if (title === null || title.trim() === '') return;
        const description = prompt('Project description:', project.description);
        if (description === null || description.trim() === '') return;
        const image = prompt('Image path/url:', project.image || '') ?? '';
        const tech = prompt('Tech (comma separated):', project.tech.join(', ')) ?? '';
        const demo = prompt('Live demo link:', project.demo || '') ?? '';
        const github = prompt('GitHub link:', project.github || '') ?? '';

        projects[index] = {
            title: title.trim(),
            description: description.trim(),
            image: image.trim(),
            tech: tech.split(',').map(item => item.trim()).filter(Boolean),
            demo: demo.trim(),
            github: github.trim()
        };
        renderProjects();
        saveContentToStorage();
    }

    const deleteIndex = target.getAttribute('data-project-delete');
    if (deleteIndex !== null) {
        if (!isEditEnabled) return;
        const index = Number(deleteIndex);
        projects = projects.filter((_, i) => i !== index);
        renderProjects();
        saveContentToStorage();
    }
});

// Contact form submission
document.getElementById('contact-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    if (name && email && subject && message) {
        alert('Thank you for your message, ' + name + '! I will get back to you soon.');
        this.reset();
    } else {
        alert('Please fill in all fields.');
    }
});

function animateSkillBars() {
    document.querySelectorAll('.skill-fill').forEach(bar => {
        const rect = bar.getBoundingClientRect();
        if (rect.top < window.innerHeight - 50) {
            bar.style.width = bar.style.width || '0%';
        }
    });
}

window.addEventListener('scroll', function() {
    document.querySelectorAll('.section').forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
    animateSkillBars();
});

document.addEventListener('DOMContentLoaded', function() {
    loadContentFromStorage();
    renderProjects();

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s, transform 0.6s';
    });
    animateSkillBars();

    setupEditableBlock('edit-personal-btn', 'personal-info');
    setupEditableBlock('edit-education-btn', 'education-info');
    setupEditableBlock('edit-achievements-btn', 'achievements-list');

    const toggleEditVisibilityButton = document.getElementById('toggle-edit-visibility');
    toggleEditVisibilityButton?.addEventListener('click', function () {
        setEditEnabled(!isEditEnabled);
    });

    document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
            event.preventDefault();
            setEditEnabled(!isEditEnabled);
        }
    });

    const addEducationBtn = document.getElementById('add-education-btn');
    const addEducationForm = document.getElementById('add-education-form-inline');
    addEducationBtn?.addEventListener('click', () => {
        if (!isEditEnabled) return;
        if (addEducationForm) {
            addEducationForm.style.display = addEducationForm.style.display === 'grid' ? 'none' : 'grid';
        }
    });

    addEducationForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const level = document.getElementById('edu-level').value.trim();
        const text = document.getElementById('edu-text').value.trim();
        const link = document.getElementById('edu-link').value.trim();
        if (!level || !text) return;

        const educationInfo = document.getElementById('education-info');
        const paragraph = document.createElement('p');
        paragraph.innerHTML = `<strong>${level}:</strong> <a href="${createSafeLink(link)}" class="info-link">${text}</a>`;
        educationInfo?.appendChild(paragraph);
        saveContentToStorage();
        this.reset();
        this.style.display = 'none';
    });

    const addAchievementBtn = document.getElementById('add-achievement-btn');
    const addAchievementForm = document.getElementById('add-achievement-form-inline');
    addAchievementBtn?.addEventListener('click', () => {
        if (!isEditEnabled) return;
        if (addAchievementForm) {
            addAchievementForm.style.display = addAchievementForm.style.display === 'grid' ? 'none' : 'grid';
        }
    });

    addAchievementForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const text = document.getElementById('achievement-text').value.trim();
        const link = document.getElementById('achievement-link').value.trim();
        if (!text) return;

        const achievementsList = document.getElementById('achievements-list');
        const item = document.createElement('li');
        item.innerHTML = `<a href="${createSafeLink(link)}" class="info-link">${text}</a>`;
        achievementsList?.appendChild(item);
        saveContentToStorage();
        this.reset();
        this.style.display = 'none';
    });

    const addProjectBtn = document.getElementById('add-project-btn');
    const addProjectForm = document.getElementById('add-project-form-inline');
    addProjectBtn?.addEventListener('click', () => {
        if (!isEditEnabled) return;
        if (addProjectForm) {
            addProjectForm.style.display = addProjectForm.style.display === 'grid' ? 'none' : 'grid';
        }
    });

    addProjectForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = document.getElementById('project-title').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const image = document.getElementById('project-image').value.trim();
        const techText = document.getElementById('project-tech').value.trim();
        const demo = document.getElementById('project-demo').value.trim();
        const github = document.getElementById('project-github').value.trim();
        if (!title || !description) return;

        projects.push({
            title,
            description,
            image,
            tech: techText ? techText.split(',').map(item => item.trim()).filter(Boolean) : [],
            demo,
            github
        });
        renderProjects();
        saveContentToStorage();
        this.reset();
        this.style.display = 'none';
    });

    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            const content = this.querySelector('.timeline-content');
            if (content) content.style.transform = 'scale(1.02)';
        });
        item.addEventListener('mouseleave', function() {
            const content = this.querySelector('.timeline-content');
            if (content) content.style.transform = 'scale(1)';
        });
    });

    setEditEnabled(false);
});
