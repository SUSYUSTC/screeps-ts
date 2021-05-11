module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-ts")
    grunt.initConfig({
        'ts': {
            default : {
                options: {
                    sourceMap: false,
                    target: 'es5',
                    rootDir: "src/"
                },
                src: ["src/*.ts", "!src/index.ts"],
                outDir: 'dist/'
            }
        }
    })
    grunt.registerTask('default',  [ 'ts' ])
}
