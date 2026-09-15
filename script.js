// ── PRELOADER LOGIC ──
const initPreloader = () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const messages = document.querySelectorAll('.pl-message');
    const fill = document.getElementById('pl-progress-fill');
    const percentTxt = document.getElementById('pl-progress-percent');
    
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        if (msgIndex < messages.length - 1) {
            messages[msgIndex].classList.remove('active');
            messages[msgIndex].classList.add('done');
            msgIndex++;
            messages[msgIndex].classList.add('active');
        }
    }, 400);

    let progress = 0;
    let pageLoaded = false;
    let isTransitioning = false;
    
    window.addEventListener('load', () => { pageLoaded = true; });

    const progressInterval = setInterval(() => {
        if (isTransitioning) return;
        
        let increment = Math.random() * 2 + 1; // 1 to 3 per frame (approx 30 frames to 100 -> ~900ms)
        
        if (!pageLoaded && progress > 85) {
            increment = Math.random() * 0.3; // Crawl while waiting
        } else if (pageLoaded && progress > 85) {
            increment = Math.random() * 4 + 2; // Speed up at the end
        }
        
        progress += increment;

        if (progress >= 100) {
            progress = 100;
            finishPreloader();
        }

        fill.style.width = `${progress}%`;
        percentTxt.innerText = `${Math.floor(progress)}%`;

    }, 30);

    const finishPreloader = () => {
        isTransitioning = true;
        clearInterval(msgInterval);
        clearInterval(progressInterval);
        
        messages.forEach(m => { m.classList.remove('active'); m.classList.add('done'); });
        const textContainer = document.querySelector('.pl-message-container');
        if (textContainer) {
            const readyMsg = document.createElement('span');
            readyMsg.className = 'pl-message active';
            readyMsg.innerText = 'Ready';
            textContainer.appendChild(readyMsg);
        }

        // Expand center light
        const logoWrapper = document.querySelector('.preloader-logo-wrapper');
        if (logoWrapper) {
            logoWrapper.style.transform = 'scale(1.05)';
        }

        setTimeout(() => {
            preloader.classList.add('loaded');
            
            // Staggered Reveal
            setTimeout(() => {
                document.body.classList.add('preloader-finished');
            }, 100); // Trigger landing page anims
        }, 600);
    };

    // Safety fallback
    setTimeout(() => {
        if (!isTransitioning) {
            pageLoaded = true;
            progress = 100;
            finishPreloader();
        }
    }, 3000);
};

initPreloader();

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── PREMIUM TEXT SPLITTING ──
    document.querySelectorAll('.wipe-text, .section-title').forEach(el => {
        if (!el.classList.contains('anim-word-stagger') && !el.classList.contains('anim-line-reveal')) {
            // Apply different styles alternately or specifically based on section
            const parentId = el.closest('section')?.id;
            if (parentId === 'services') el.classList.add('anim-word-stagger');
            else el.classList.add('anim-line-reveal');
        }
        
        if (el.classList.contains('anim-word-stagger')) {
            // Preserve <br> and increase the animation effect
            const htmlNodes = Array.from(el.childNodes);
            el.innerHTML = '';
            let wordIndex = 0;
            
            htmlNodes.forEach(node => {
                if (node.nodeType === 3) { // Text node
                    const words = node.textContent.split(/(\s+)/).filter(w => w.length > 0);
                    words.forEach(word => {
                        if (word.trim().length === 0) {
                            el.appendChild(document.createTextNode(word));
                        } else {
                            const span = document.createElement('span');
                            span.innerText = word;
                            span.style.display = 'inline-block';
                            span.style.opacity = '0';
                            // Increased animation: bigger translate, added scale
                            span.style.transform = 'translateY(50px) scale(0.85)';
                            // Increased duration and stagger
                            span.style.transition = `all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${wordIndex * 0.12}s`;
                            el.appendChild(span);
                            wordIndex++;
                        }
                    });
                } else if (node.nodeName.toUpperCase() === 'BR') {
                    el.appendChild(document.createElement('br'));
                } else {
                    el.appendChild(node.cloneNode(true));
                }
            });
        } else if (el.classList.contains('anim-line-reveal')) {
            const html = el.innerHTML;
            el.innerHTML = `<span style="display:block; overflow:hidden;"><span class="line-inner" style="display:block; opacity:0; transform:translateY(100%); transition:all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;">${html}</span></span>`;
        }
    });

    // ── UNIVERSAL INTERSECTION OBSERVER ──
    const globalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                entry.target.classList.add('revealed'); // Keep compatibility with old CSS
                
                // Trigger text animations
                entry.target.querySelectorAll('.anim-word-stagger span').forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0) scale(1)';
                });
                entry.target.querySelectorAll('.anim-line-reveal .line-inner').forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0)';
                });

                // Trigger Section 2 Counters
                if (entry.target.id === 'about') {
                    const counters = entry.target.querySelectorAll('.stat-counter');
                    setTimeout(() => {
                        counters.forEach(counter => {
                            const target = parseInt(counter.getAttribute('data-target') || counter.dataset.target, 10);
                            if(isNaN(target)) return;
                            const duration = 2000;
                            let startTime = null;

                            const easeOutBack = (x) => {
                                const c1 = 1.70158;
                                const c3 = c1 + 1;
                                return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
                            };

                            const step = (timestamp) => {
                                if (!startTime) startTime = timestamp;
                                const progress = Math.min((timestamp - startTime) / duration, 1);
                                const currentVal = Math.min(Math.floor(easeOutBack(progress) * target), target);
                                counter.textContent = Math.max(0, currentVal);

                                if (progress < 1) {
                                    requestAnimationFrame(step);
                                } else {
                                    counter.textContent = target;
                                }
                            };
                            requestAnimationFrame(step);
                        });
                    }, 400); // Slight delay to let the stat-item slide up first
                }

                globalObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('section').forEach(sec => {
        sec.classList.add('premium-section');
        globalObserver.observe(sec);
    });

    // ── SCROLL PROGRESS & PARALLAX ──
    const topProgress = document.getElementById('top-scroll-progress');
    const heroImage = document.querySelector('.hero-img');
    const bgGlow = document.querySelector('.hero-glow');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Progress Bar
        if (topProgress) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPct = Math.min((scrollY / docHeight) * 100, 100);
            topProgress.style.width = scrollPct + '%';
        }

        // Reduced motion check
        if (prefersReducedMotion) return;

        // Subtle Parallax (Mouse parallax logic is separate)
        if (heroImage && scrollY < window.innerHeight) {
            heroImage.style.transform = `translateY(${scrollY * 0.08}px) scale(1)`;
        }
        
        // Parallax for specific class
        document.querySelectorAll('.scroll-parallax').forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const yPos = (window.innerHeight - rect.top) * speed;
                el.style.transform = `translateY(-${yPos}px)`;
            }
        });
    }, { passive: true });

    // ── HERO MOUSE PARALLAX ──
    const heroSection = document.getElementById('hero');
    if (heroSection && !prefersReducedMotion) {
        heroSection.addEventListener('mousemove', (e) => {
            if (heroImage && bgGlow) {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
                heroImage.style.transform = `translate(${xAxis}px, ${yAxis}px) scale(1.02)`;
                bgGlow.style.transform = `translate(${xAxis * 0.5}px, ${yAxis * 0.5}px)`;
            }
        });
        heroSection.addEventListener('mouseleave', () => {
            if (heroImage && bgGlow) {
                heroImage.style.transform = `translate(0, 0) scale(1)`;
                bgGlow.style.transform = `translate(0, 0)`;
            }
        });
    }

    // ── 1. NAVBAR SCROLL & BACKDROP
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const handleNavScroll = () => {
            if (window.scrollY > 30) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleNavScroll, { passive: true });
        handleNavScroll();
    }

    // ── 2. MOBILE HAMBURGER MENU (SAFE SCROLL LOCK)
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenuWrapper = document.getElementById('nav-menu-wrapper');
    let savedScrollY = 0;
    let isMenuOpen = false;

    if (hamburgerBtn && navMenuWrapper) {
        const openMenu = () => {
            isMenuOpen = true;
            savedScrollY = window.scrollY;
            hamburgerBtn.classList.add('active');
            navMenuWrapper.classList.add('open');
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflowY = 'hidden';
        };

        const closeMenu = () => {
            if (!isMenuOpen) return;
            isMenuOpen = false;
            hamburgerBtn.classList.remove('active');
            navMenuWrapper.classList.remove('open');
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflowY = '';
            window.scrollTo(0, savedScrollY);
        };

        hamburgerBtn.addEventListener('click', () => {
            if (isMenuOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close on navigation link click
        navMenuWrapper.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // ── 3. WIPE TEXT & SECTION REVEALS WITH STAGGER
    const wipeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('wiped');
                wipeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0 });

    document.querySelectorAll('.wipe-text').forEach(el => {
        if (el.closest('.hero-section')) {
            setTimeout(() => el.classList.add('wiped'), 150);
        } else {
            wipeObserver.observe(el);
        }
    });

    // Final CTA & Footer reveals
    const finalCta = document.getElementById('final-cta');
    if (finalCta) {
        const ctaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    ctaObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        ctaObserver.observe(finalCta);
    }

    const siteFooter = document.getElementById('site-footer');
    if (siteFooter) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    footerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0 });
        footerObserver.observe(siteFooter);
    }

    // ── 4. HERO BOTTOM BAR STAGGER
    const heroBottomBar = document.getElementById('hero-bottom-bar');
    if (heroBottomBar) {
        const items = heroBottomBar.querySelectorAll('.service-keyword, .separator');
        const barObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('reveal-up');
                        }, index * 90);
                    });
                    barObserver.unobserve(heroBottomBar);
                }
            });
        }, { threshold: 0.4 });
        barObserver.observe(heroBottomBar);
    }

    // ── 5. SECTION 2: STATS RING COUNTERS (SPRING EASING) ──
    const sectionTwo = document.getElementById('about');
    if (sectionTwo) {
        if (!prefersReducedMotion) {
            const secTwoImg = sectionTwo.querySelector('#parallax-img-2');
            const secTwoGlow = sectionTwo.querySelector('.glow-bg-radial');
            const fc1 = sectionTwo.querySelector('.fc-1');
            const fc2 = sectionTwo.querySelector('.fc-2');
            const fc3 = sectionTwo.querySelector('.fc-3');
            const fc4 = sectionTwo.querySelector('.fc-4');

            window.addEventListener('scroll', () => {
                const rect = sectionTwo.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const scrollPct = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                    
                    if (secTwoImg) secTwoImg.style.transform = `translateY(${scrollPct * -40}px) scale(1.05)`;
                    if (secTwoGlow) secTwoGlow.style.transform = `translateY(${scrollPct * -20}px)`;
                    
                    if (fc1) fc1.style.transform = `translateY(${scrollPct * -60}px)`;
                    if (fc2) fc2.style.transform = `translateY(${scrollPct * -90}px)`;
                    if (fc3) fc3.style.transform = `translateY(${scrollPct * -40}px)`;
                    if (fc4) fc4.style.transform = `translateY(${scrollPct * -70}px)`;
                }
            }, { passive: true });
        }
    }

    // ── 6. SECTION 3: INTERACTIVE DIAGRAM HOVER & SVG PULSE
    const sectionThree = document.getElementById('services');
    if (sectionThree) {
        const secThreeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sectionThree.classList.add('revealed');
                    secThreeObserver.unobserve(sectionThree);
                }
            });
        }, { threshold: 0.25 });
        secThreeObserver.observe(sectionThree);
    }

    const featureItems = document.querySelectorAll('.feature-item');
    const connPaths = document.querySelectorAll('.conn-path');
    const centerHub = document.getElementById('center-hub');

    featureItems.forEach(item => {
        const index = item.dataset.index;
        const matchingPath = document.querySelector(`.conn-path.path-${index}`);

        item.addEventListener('mouseenter', () => {
            if (matchingPath) {
                matchingPath.style.stroke = '#93C5FD';
                matchingPath.style.strokeWidth = '3.5';
                matchingPath.style.filter = 'drop-shadow(0 0 10px #3B82F6)';
                matchingPath.style.opacity = '1';
            }
            if (centerHub) {
                centerHub.style.boxShadow = '0 0 75px rgba(96, 165, 250, 0.75), inset 0 0 30px rgba(96, 165, 250, 0.5)';
                centerHub.style.transform = 'translate(-50%, -50%) scale(1.08)';
            }
        });

        item.addEventListener('mouseleave', () => {
            if (matchingPath) {
                matchingPath.style.stroke = '';
                matchingPath.style.strokeWidth = '';
                matchingPath.style.filter = '';
                matchingPath.style.opacity = '';
            }
            if (centerHub) {
                centerHub.style.boxShadow = '';
                centerHub.style.transform = '';
            }
        });
    });

    // ── 7. SECTION 4: PINNED HORIZONTAL STORYTELLING
    const valueSection = document.getElementById('section-four');
    const valueInner = document.getElementById('value-pinned-inner');
    const cardsTrack = document.getElementById('value-cards-track');
    const trackViewport = document.querySelector('.value-track-viewport');
    const vcards = document.querySelectorAll('.vcard');
    const progDots = document.querySelectorAll('.vprog-dot');
    const progFills = [
        document.getElementById('vprog-fill'),
        document.getElementById('vprog-fill2'),
        document.getElementById('vprog-fill3')
    ];
    const progLabel = document.getElementById('vprog-label');

    let isDesktopStory = window.innerWidth > 900;

    const setupHorizontalScroll = () => {};

    const updateStoryteller = () => {};

    setupHorizontalScroll();
    window.addEventListener('resize', () => {
        setupHorizontalScroll();
        updateStoryteller();
    });

    window.addEventListener('scroll', updateStoryteller, { passive: true });
    updateStoryteller();

    // Dot click navigation
    progDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetIdx = parseInt(dot.dataset.idx, 10);
            if (isDesktopStory && valueSection) {
                const scrollDistance = valueSection.offsetHeight - window.innerHeight;
                const sectionTop = valueSection.offsetTop;
                const targetProgress = targetIdx / (vcards.length - 1);
                const targetScroll = sectionTop + targetProgress * scrollDistance;
                window.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            } else if (trackViewport) {
                const card = vcards[targetIdx];
                if (card) {
                    trackViewport.scrollTo({
                        left: card.offsetLeft - 20,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Mobile swipe sync for value cards
    if (trackViewport) {
        trackViewport.addEventListener('scroll', () => {
            if (isDesktopStory) return;
            const scrollLeft = trackViewport.scrollLeft;
            const cardWidth = vcards[0] ? vcards[0].offsetWidth + 20 : 300;
            const activeIdx = Math.min(Math.round(scrollLeft / cardWidth), vcards.length - 1);

            vcards.forEach((c, i) => c.classList.toggle('v-active', i === activeIdx));
            progDots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
            if (progLabel) progLabel.textContent = `0${activeIdx + 1} / 0${vcards.length}`;
        }, { passive: true });
    }

    // ── 8. SECTION 6: TESTIMONIALS CAROUSEL (MOBILE)
    const testGrid = document.getElementById('testimonials-grid');
    const prevBtn = document.getElementById('t-prev');
    const nextBtn = document.getElementById('t-next');
    const testDots = document.querySelectorAll('#t-dots .dot');

    if (testGrid) {
        const updateTestimonialDots = () => {
            const scrollLeft = testGrid.scrollLeft;
            const cardWidth = testGrid.querySelector('.testimonial-card') ? testGrid.querySelector('.testimonial-card').offsetWidth + 20 : 320;
            const activeIdx = Math.min(Math.round(scrollLeft / cardWidth), testDots.length - 1);

            testDots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
        };

        testGrid.addEventListener('scroll', updateTestimonialDots, { passive: true });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const cardWidth = testGrid.querySelector('.testimonial-card').offsetWidth + 20;
                testGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const cardWidth = testGrid.querySelector('.testimonial-card').offsetWidth + 20;
                testGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
            });
        }

        testDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.dataset.index, 10);
                const cards = testGrid.querySelectorAll('.testimonial-card');
                if (cards[idx]) {
                    testGrid.scrollTo({
                        left: cards[idx].offsetLeft - 24,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ── 9. SECTION 7: FAQ ACCORDION
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isCurrentlyActive = item.classList.contains('active');

                // Single-open accordion with smooth collapse
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                item.classList.toggle('active', !isCurrentlyActive);
            });
        }
    });

    // ── 10. 3D PERSPECTIVE TILT & INTERACTIVE SPOTLIGHT ON CARDS
    if (!prefersReducedMotion) {
        // Hero Image 3D Tilt
        const heroSec = document.getElementById('hero');
        const heroImgWrap = document.getElementById('parallax-img');
        if (heroSec && heroImgWrap) {
            heroSec.addEventListener('mousemove', (e) => {
                const rect = heroSec.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                heroImgWrap.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-8px)`;
            });

            heroSec.addEventListener('mouseleave', () => {
                heroImgWrap.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)';
            });
        }

        // Section 2 Image 3D Tilt
        const secTwoImageMask = document.querySelector('.image-mask');
        if (secTwoImageMask) {
            secTwoImageMask.addEventListener('mousemove', (e) => {
                const rect = secTwoImageMask.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                secTwoImageMask.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
            });

            secTwoImageMask.addEventListener('mouseleave', () => {
                secTwoImageMask.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
            });
        }

        // Testimonial Cards 3D Tilt
        document.querySelectorAll('.testimonial-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-8px) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)';
            });
        });
    }

    // --- NEW BEHAVIORS FROM LATEST REQUEST ---
    
    // Scrollspy removed as requested by user to keep Home active on the home page.
    
    // Smooth scroll for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                // close hamburger if open
                if (navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                    hamburgerBtn.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.style.overflowX = 'hidden';
                }
                
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 2. Circular Metrics Counting Animation
    const statsCounters = document.querySelectorAll('.stat-counter');
    const ringProgresses = document.querySelectorAll('.ring-progress');
    
    const animateStats = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statsCounters.forEach((counter, idx) => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000;
                    const startTime = performance.now();
                    
                    const updateCounter = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // smooth easing out
                        const easeProgress = 1 - Math.pow(1 - progress, 3); 
                        const current = Math.round(easeProgress * target);
                        counter.innerText = current;
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    requestAnimationFrame(updateCounter);
                    
                    // Animate SVG Ring
                    const ring = ringProgresses[idx];
                    if (ring) {
                        const r = ring.r.baseVal.value;
                        const circumference = 2 * Math.PI * r;
                        ring.style.strokeDasharray = `${circumference} ${circumference}`;
                        ring.style.strokeDashoffset = circumference;
                        
                        // Force reflow
                        ring.getBoundingClientRect();
                        
                        ring.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)';
                        // Calculate offset based on target. target is either 360 or 100.
                        // if 360, it's 360/360 = 100%. if 100, it's 100/100 = 100%.
                        // For demonstration, let's assume target 100 is 100% and 360 is 100%.
                        ring.style.strokeDashoffset = '0';
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    };
    
    const statsSection = document.querySelector('.stats-row');
    if (statsSection) {
        const statsObserver = new IntersectionObserver(animateStats, { threshold: 0.5 });
        statsObserver.observe(statsSection);
    }
    
    // 3. Image Parallax and Scale animations
    const imagesToObserve = document.querySelectorAll('.anim-image, .procurement-img, .center-building-img img');
    imagesToObserve.forEach(img => img.classList.add('anim-scale-in'));
    
    // Reuse existing observer logic but target these image elements as well
    const extraObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('wiped');
            }
        });
    }, { threshold: 0.2 });
    
    imagesToObserve.forEach(img => extraObserver.observe(img));
    
    // 4. Testimonials Sequence reveal
    const testimonials = document.querySelectorAll('.testimonial-card');
    testimonials.forEach((el, index) => {
        el.classList.add('reveal-up');
        el.style.animationDelay = `${0.2 + (index * 0.15)}s`;
        extraObserver.observe(el);
    });
    
    // 5. Footer Stagger reveal
    
    const footer = document.querySelector('.site-footer');
    if (footer) {
        // Set initial state dynamically so it falls back to visible if JS fails
        const footerElements = footer.querySelectorAll('.foot-col-anim');
        footerElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    footerElements.forEach((el, index) => {
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                    footerObserver.unobserve(footer);
                }
            });
        }, { threshold: 0 });
        footerObserver.observe(footer);
    }



    // 6. Business Value Section reveals
    const valueSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('.card-visual');
                const text = entry.target.querySelector('.card-text');
                if (img) {
                    img.style.opacity = '1';
                    img.style.transform = 'translateY(0) scale(1)';
                }
                if (text) {
                    setTimeout(() => {
                        text.style.opacity = '1';
                        text.style.transform = 'translateY(0)';
                    }, 200);
                }
                valueSectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('.value-card').forEach(card => {
        const img = card.querySelector('.card-visual');
        const text = card.querySelector('.card-text');
        if (img) {
            img.style.opacity = '0';
            img.style.transform = 'translateY(20px) scale(0.96)';
            img.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
        if (text) {
            text.style.opacity = '0';
            text.style.transform = 'translateY(20px)';
            text.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
        valueSectionObserver.observe(card);
    });

    // 7. Navbar Active Underline Animation
    // The CSS nav-links a::after handles the transition smoothly from 0 to 100%. 
    // To make it slide between items seamlessly, we would need a floating indicator, 
    // but toggling .active is sufficient with the current CSS which transitions the width.


    const midCtaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imgSide = entry.target.querySelector('.cta-image-side');
                const textSide = entry.target.querySelector('.cta-text-side');
                const closingLine = entry.target.querySelector('.closing-line');
                
                if (imgSide) {
                    imgSide.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    imgSide.style.opacity = '1';
                    imgSide.style.transform = 'translateY(0) scale(1)';
                }
                if (textSide) {
                    setTimeout(() => {
                        textSide.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                        textSide.style.opacity = '1';
                        textSide.style.transform = 'translateY(0)';
                        textSide.classList.add('revealed');
                        const blueBox = entry.target.querySelector('.cta-blue-box');
                        if(blueBox) {
                            blueBox.style.transition = 'box-shadow 0.8s ease, transform 0.8s ease';
                            blueBox.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.4)';
                        }
                    }, 200);
                }
                
                entry.target.classList.add('revealed');
                midCtaObserver.unobserve(entry.target);

            }
        });
    }, { threshold: 0.3 });
    
    const midCta = document.querySelector('.cta-banner-section-v2');
    if (midCta) {
        const imgSide = midCta.querySelector('.cta-image-side');
        const textSide = midCta.querySelector('.cta-text-side');
        if (imgSide) {
            
            
        }
        if (textSide) {
            
            
        }
        midCtaObserver.observe(midCta);
    }


    // Clip-path image reveals for ALL main images
    const allImages = document.querySelectorAll('img');
    
    const clipObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed-clip');
                // Also trigger wiped if they have anim-scale-in
                if (entry.target.classList.contains('anim-scale-in')) {
                    entry.target.classList.add('wiped');
                }
                clipObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0 });

    allImages.forEach(img => {
        // If it's already an anim-image, it relies on keyframes, but let's add the class anyway
        // Wait, for heroImageFloatUp, it animates automatically via keyframes, so it doesn't need intersection observer.
        // We will only observe images that don't have .anim-image, or if they do, we'll let keyframe handle it but add revealed-clip just in case.
        if (!img.closest('.anim-image')) {
            img.classList.add('clip-reveal-image');
            clipObserver.observe(img);
        }
    });
    
    // For elements that are already 'anim-scale-in' but not imgs (like wrappers), make sure they wipe
    const extraWrappers = document.querySelectorAll('.anim-scale-in:not(img)');
    extraWrappers.forEach(wrap => {
        clipObserver.observe(wrap);
    });


    
    // Dedicated Testimonials Split Observer
    const testimGrid = document.getElementById('testimonials-grid');
    if (testimGrid) {
        const tObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Trigger the fan-out animation when the grid is well in view
                    entry.target.classList.add('cards-split');
                }
            });
        }, { rootMargin: '-25% 0px -25% 0px', threshold: 0 });
        tObserver.observe(testimGrid);
    }
// Fallback: forcefully reveal images after 2.5 seconds just in case IntersectionObserver fails
    setTimeout(() => {
          document.querySelectorAll('.clip-reveal-image').forEach(img => {
              img.classList.add('revealed-clip');
          });
          document.querySelectorAll('.anim-scale-in').forEach(wrap => {
              wrap.classList.add('wiped');
          });
          const tGrid = document.getElementById('testimonials-grid');
          if (tGrid) tGrid.classList.add('cards-split');
      }, 2500);

});

    // --- PROCESS SECTION ANIMATION ---
    const processSection = document.getElementById('process-section');
    if (processSection) {
        const lineFill = processSection.querySelector('.process-line-fill');
        const steps = processSection.querySelectorAll('.process-step');
        const subtitle = processSection.querySelector('.process-subtitle');

        const processObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (subtitle) subtitle.classList.add('visible');
                    
                    // Simple logic to draw line based on scroll position inside the section
                    const updateLine = () => {
                        const rect = processSection.getBoundingClientRect();
                        const windowHeight = window.innerHeight;
                        // Calculate how much of the section has been scrolled
                        // We want the line to grow as we scroll down
                        let scrollPercent = (windowHeight / 2 - rect.top) / rect.height;
                        scrollPercent = Math.max(0, Math.min(1, scrollPercent));
                        
                        if (lineFill) {
                            lineFill.style.height = (scrollPercent * 100) + '%';
                        }
                    };
                    
                    window.addEventListener('scroll', updateLine);
                    updateLine(); // Initial call
                }
            });
        }, { rootMargin: '-25% 0px -25% 0px', threshold: 0 });
        processObserver.observe(processSection);

        // Animate steps coming in
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    stepObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5, rootMargin: "0px 0px -100px 0px" });

        steps.forEach(step => stepObserver.observe(step));
    }

    // --- METRICS COUNTER ANIMATION ---
    const metricCards = document.querySelectorAll('.metric-card');
    const metricObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                const counter = entry.target.querySelector('.counter');
                if (counter && !counter.classList.contains('counted')) {
                    counter.classList.add('counted');
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000;
                    const stepTime = Math.abs(Math.floor(duration / target));
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += Math.ceil(target / 50);
                        if (current >= target) {
                            counter.innerText = target;
                            clearInterval(timer);
                        } else {
                            counter.innerText = current;
                        }
                    }, stepTime);
                }
                metricObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    metricCards.forEach(card => metricObserver.observe(card));


    // --- ADVANCED SECTION STAGGERED ANIMATIONS ---
    const allSections = document.querySelectorAll('section, .content-container, .grid');
    allSections.forEach(section => {
        const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const passages = section.querySelectorAll('p, li, .body-text');
        
        // Only apply if they exist in the section
        if (headings.length > 0 || passages.length > 0) {
            headings.forEach(h => h.classList.add('anim-section-heading'));
            passages.forEach(p => p.classList.add('anim-section-passage'));
        }
    });

    const advancedSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // First animate headings
                const headings = target.querySelectorAll('.anim-section-heading');
                headings.forEach((h, index) => {
                    setTimeout(() => h.classList.add('revealed'), index * 100);
                });
                
                // Then animate passages after headings
                const passages = target.querySelectorAll('.anim-section-passage');
                passages.forEach((p, index) => {
                    setTimeout(() => p.classList.add('revealed'), 300 + (index * 50));
                });
                
                advancedSectionObserver.unobserve(target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    allSections.forEach(section => {
        advancedSectionObserver.observe(section);
    });


// TESTIMONIALS AUTO-LOOP AND EXPAND LOGIC
let testimIndex = 0;
let testimInterval;
let isPaused = false;

function initTestimonials() {
    const cards = document.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    
    const grid = document.getElementById('testimonials-grid');
    let dotsContainer = document.getElementById('testim-indicators');
    if (!dotsContainer && grid) {
        dotsContainer = document.createElement('div');
        dotsContainer.id = 'testim-indicators';
        dotsContainer.style.display = 'flex';
        dotsContainer.style.justifyContent = 'center';
        dotsContainer.style.gap = '10px';
        dotsContainer.style.marginTop = '30px';
        grid.parentElement.appendChild(dotsContainer);
        
        for (let i = 0; i < cards.length; i++) {
            const dot = document.createElement('div');
            dot.style.width = '10px';
            dot.style.height = '10px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = 'rgba(255,255,255,0.2)';
            dot.style.transition = 'all 0.3s ease';
            dot.style.cursor = 'pointer';
            dot.addEventListener('click', () => {
                testimIndex = i;
                isPaused = true;
                updateCards();
                setTimeout(() => { isPaused = false; }, 5000);
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    function updateCards() {
        cards.forEach((card, i) => {
            card.classList.remove('t-active', 't-next', 't-prev', 'expanded');
            if (i === testimIndex) {
                card.classList.add('t-active');
            } else if (i === (testimIndex + 1) % cards.length) {
                card.classList.add('t-next');
            } else {
                card.classList.add('t-prev');
            }
        });
        if (dotsContainer) {
            Array.from(dotsContainer.children).forEach((dot, i) => {
                if (i === testimIndex) {
                    dot.style.backgroundColor = '#3B82F6';
                    dot.style.transform = 'scale(1.3)';
                } else {
                    dot.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    dot.style.transform = 'scale(1)';
                }
            });
        }
    }
    
    function nextTestim() {
        if (!isPaused) {
            testimIndex = (testimIndex + 1) % cards.length;
            updateCards();
        }
    }
    
    updateCards();
    testimInterval = setInterval(nextTestim, 3500);
}

window.toggleExpand = function(card) {
    if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        isPaused = false;
    } else {
        // Remove expanded from all
        document.querySelectorAll('.testimonial-card').forEach(c => c.classList.remove('expanded'));
        card.classList.add('expanded');
        isPaused = true; // Pause loop while reading
    }
};

document.addEventListener('DOMContentLoaded', initTestimonials);
