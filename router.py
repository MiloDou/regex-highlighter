from flask import render_template, request, jsonify
import re

def configure_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/apply_regex', methods=['POST'])
    def apply_regex():
        try:
            data = request.get_json()
            text = data.get('text', '')
            patterns = data.get('patterns', [])
            
            results = []
            for pattern_info in patterns:
                pattern = pattern_info.get('pattern')
                color = pattern_info.get('color')
                
                try:
                    regex = re.compile(pattern)
                    matches = []
                    for match in regex.finditer(text):
                        matches.append({
                            'start': match.start(),
                            'end': match.end(),
                            'text': match.group(),
                            'color': color
                        })
                    results.extend(matches)
                except re.error as e:
                    return jsonify({
                        'error': f'Invalid pattern {pattern}: {str(e)}'
                    }), 400
            
            return jsonify({
                'success': True,
                'matches': results
            })
            
        except Exception as e:
            return jsonify({
                'error': str(e)
            }), 500