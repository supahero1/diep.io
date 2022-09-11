{
  "targets": [
    {
      "target_name": "pow_solver",
      "sources": ["pow_solver.cpp"],
      "conditions": [
        ['OS=="win"', {
          "include_dirs": ["C:\Program Files\OpenSSL-Win64\include"],
          "library_dirs": ["C:\Program Files\OpenSSL-Win64\lib"],
          "libraries": ["-llibssl", "-llibcrypto"]
        }, {
          "libraries": ["-lssl", "-lcrypto"]
        }]
      ],
      "cflags": ["-march=native"]
    }
  ]
}
