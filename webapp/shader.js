// WebGL Dithering Shader Effect
// Красивый анимированный шейдер для фона

class ShaderBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.warn('WebGL not supported');
            return;
        }

        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.time = 0;

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        const gl = this.gl;

        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment shader - Dithering warp effect
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 resolution;
            uniform float time;
            uniform vec2 mouse;
            
            // Dither pattern
            float dither4x4(vec2 position, float brightness) {
                int x = int(mod(position.x, 4.0));
                int y = int(mod(position.y, 4.0));
                int index = x + y * 4;
                float limit = 0.0;
                
                if (index == 0) limit = 0.0625;
                else if (index == 1) limit = 0.5625;
                else if (index == 2) limit = 0.1875;
                else if (index == 3) limit = 0.6875;
                else if (index == 4) limit = 0.8125;
                else if (index == 5) limit = 0.3125;
                else if (index == 6) limit = 0.9375;
                else if (index == 7) limit = 0.4375;
                else if (index == 8) limit = 0.25;
                else if (index == 9) limit = 0.75;
                else if (index == 10) limit = 0.125;
                else if (index == 11) limit = 0.625;
                else if (index == 12) limit = 1.0;
                else if (index == 13) limit = 0.5;
                else if (index == 14) limit = 0.875;
                else limit = 0.375;
                
                return brightness < limit ? 0.0 : 1.0;
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec2 center = vec2(0.5);
                
                // Warp effect
                float dist = distance(uv, center);
                float angle = atan(uv.y - center.y, uv.x - center.x);
                float warp = sin(dist * 10.0 - time * 0.5 + angle * 3.0) * 0.1;
                
                uv += warp * (uv - center);
                
                // Create flowing pattern
                float pattern = sin(uv.x * 20.0 + time * 0.3) * 0.5 + 0.5;
                pattern += sin(uv.y * 15.0 - time * 0.4) * 0.5;
                pattern += sin((uv.x + uv.y) * 10.0 + time * 0.2) * 0.3;
                pattern = pattern / 2.0;
                
                // Mouse interaction
                float mouseDist = distance(uv, mouse);
                pattern += smoothstep(0.3, 0.0, mouseDist) * 0.3;
                
                // Dithering
                float dithered = dither4x4(gl_FragCoord.xy, pattern);
                
                // Medical blue color scheme
                vec3 colorBack = vec3(0.05, 0.1, 0.2);  // Dark blue
                vec3 colorFront = vec3(0.29, 0.56, 0.85); // Medical blue #4A90D9
                
                vec3 finalColor = mix(colorBack, colorFront, dithered * 0.4);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program failed to link');
            return;
        }

        gl.useProgram(this.program);

        // Create quad
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Get uniform locations
        this.resolutionLocation = gl.getUniformLocation(this.program, 'resolution');
        this.timeLocation = gl.getUniformLocation(this.program, 'time');
        this.mouseLocation = gl.getUniformLocation(this.program, 'mouse');

        this.resize();
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    resize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;

        this.gl.viewport(0, 0, displayWidth, displayHeight);
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());

        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX / window.innerWidth;
            this.mouseY = 1.0 - (e.clientY / window.innerHeight);
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX / window.innerWidth;
                this.mouseY = 1.0 - (e.touches[0].clientY / window.innerHeight);
            }
        });
    }

    animate() {
        const gl = this.gl;
        if (!gl) return;

        this.time += 0.016; // ~60fps

        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.timeLocation, this.time);
        gl.uniform2f(this.mouseLocation, this.mouseX, this.mouseY);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize shader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ShaderBackground('shader-bg');
});
