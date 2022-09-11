{
  "targets": [
    {
      "target_name": "pow_solver",
      "sources": ["pow_solver.cpp"],
      "include_dirs": ["/usr/local/Cellar/openssl@3/3.0.3/include/"],
      "libraries": ["/usr/local/Cellar/openssl@3/3.0.3/lib/libssl.3.dylib", "/usr/local/Cellar/openssl@3/3.0.3/lib/libcrypto.3.dylib"],
      "cflags": ["-march=native"]
    }
  ]
}
