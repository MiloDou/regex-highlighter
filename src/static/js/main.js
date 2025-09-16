document.addEventListener('DOMContentLoaded', function() {
    let activePatterns = new Map(); // Changed to Map for easier pattern tracking
    const testInput = document.getElementById('testString');
    const output = document.getElementById('highlightedOutput');
    
    // Add listeners for preset buttons
    document.querySelectorAll('.regex-btn').forEach(button => {
        button.addEventListener('click', function() {
            const pattern = this.dataset.pattern;
            const color = this.dataset.color;
            
            if (this.classList.contains('active')) {
                // If button is active, deactivate it
                this.classList.remove('active');
                removePatternByValue(pattern);
            } else {
                // If button is inactive, activate it
                this.classList.add('active');
                addNewPattern(pattern, color);
            }
        });
    });

    // Add listener for custom pattern
    document.getElementById('addCustomPattern').addEventListener('click', function() {
        const patternInput = document.getElementById('customPattern');
        const pattern = patternInput.value;
        const color = document.getElementById('customColor').value;
        
        if (pattern && !activePatterns.has(pattern)) {
            addNewPattern(pattern, color);
            patternInput.value = ''; // Clear input after adding
        }
    });

    // Add listener for text changes
    testInput.addEventListener('input', debounce(processRegex, 300));

    function addNewPattern(pattern, color) {
        activePatterns.set(pattern, { pattern, color });
        updatePatternsList();
        processRegex();
    }

    function removePatternByValue(pattern) {
        activePatterns.delete(pattern);
        updatePatternsList();
        processRegex();
    }

    async function processRegex() {
        const text = testInput.value;
        
        try {
            const response = await fetch('/apply_regex', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    patterns: Array.from(activePatterns.values())
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Create an array to track which parts of the text have been matched
            const textLength = text.length;
            const matchedPositions = new Array(textLength).fill(false);

            // Sort matches by priority (uppercase first, then by length)
            const matches = data.matches.sort((a, b) => {
                // First sort by pattern type (uppercase has priority)
                if (a.color === '#FF7070' && b.color !== '#FF7070') return -1;
                if (b.color === '#FF7070' && a.color !== '#FF7070') return 1;
                
                // Then sort by match length (longer matches first)
                return (b.end - b.start) - (a.end - a.start);
            });

            // Filter out overlapping matches
            const validMatches = matches.filter(match => {
                // Check if any position in this match range is already taken
                for (let i = match.start; i < match.end; i++) {
                    if (matchedPositions[i]) return false;
                }
                
                // Mark positions as matched
                for (let i = match.start; i < match.end; i++) {
                    matchedPositions[i] = true;
                }
                return true;
            });

            // Apply highlights
            let highlightedText = text;
            validMatches.sort((a, b) => b.start - a.start); // Sort in reverse order

            validMatches.forEach(match => {
                highlightedText = 
                    highlightedText.slice(0, match.start) +
                    `<mark style="background-color: ${match.color}">` +
                    highlightedText.slice(match.start, match.end) +
                    '</mark>' +
                    highlightedText.slice(match.end);
            });

            output.innerHTML = highlightedText;
            
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function updatePatternsList() {
        const patternsList = document.getElementById('activePatternsList');
        patternsList.innerHTML = '';
        
        activePatterns.forEach((item) => {
            const tag = document.createElement('div');
            tag.className = 'pattern-tag';
            tag.style.backgroundColor = item.color;
            tag.innerHTML = `
                <span>${item.pattern}</span>
                <button onclick="removePattern('${item.pattern}')">×</button>
            `;
            patternsList.appendChild(tag);
        });
    }

    window.removePattern = function(pattern) {
        // Find and deactivate the corresponding button if it exists
        document.querySelectorAll('.regex-btn').forEach(button => {
            if (button.dataset.pattern === pattern) {
                button.classList.remove('active');
            }
        });
        removePatternByValue(pattern);
    };

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});