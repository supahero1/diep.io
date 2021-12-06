#include <shnet/tcp.h>
#include <shnet/time.h>
#include <shnet/error.h>

#include <openssl/sha.h>

#include <stdio.h>
#include <errno.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <pthread.h>

uint8_t* packet;
size_t packet_len;

uint8_t* buffer;
size_t buffer_len;

struct info {
  struct tcp_socket* socket;
  uint8_t* packet;
  uint32_t packet_len;
};

char list[] = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

#define info ((struct info*) in)

void* solve_pow(void* in) {
  uint8_t difficulty = info->packet[2];
  size_t length = info->packet_len - 3;
  uint8_t* input = malloc(length * 3);
  uint8_t output[SHA_DIGEST_LENGTH];
  for(size_t i = 0; i < length; ++i) {
    input[i] = info->packet[i + 3];
    input[i + length * 2] = info->packet[i + 3];
  }
  while(1) {
    start:;
    for(size_t j = 0; j < length; ++j) {
      input[length + j] = list[rand() % 62];
    }
    (void) SHA1(input, length * 3, output);
    size_t i = 0;
    for(; i < difficulty / 4U; ++i) {
      if(output[i / 2U] & (i & 1U ? 0x0f : 0xf0)) goto start;
    }
    size_t n = difficulty % 4U;
    size_t nibble = (output[i / 2U] & ((i & 1U) ? 0x0f : 0xf0)) >> ((i & 1U) ? 0U : 4U);
    if(n && (nibble & ((1U << n) - 1U)) != (1U << n) - 1U) goto start;
    break;
  }
  input[length - 5] = info->packet[1];
  input[length - 4] = length;
  input[length - 3] = 0;
  input[length - 2] = 0;
  input[length - 1] = 0;
  tcp_send(info->socket, input + length - 5, length + 5, data_dont_free);
  free(input);
  (void) pthread_detach(pthread_self());
  free(info->packet);
  free(in);
  return NULL;
}

void* decompress_packet(void* in) {
  const size_t total_size = (info->packet[5] << 24) | (info->packet[4] << 16) | (info->packet[3] << 8) | info->packet[2];
  uint8_t* output = malloc(total_size + 5);
  (void) memcpy(output, info->packet + 1, 5);
  output += 5;
  size_t at = 6;
  size_t aat = 0;
  while(1) {
    const size_t token = info->packet[at++];
    size_t literalLength = token >> 4;
    if(literalLength == 0xf) {
      do {
        literalLength += info->packet[at];
      } while(info->packet[at++] == 0xff);
    }
    for(size_t i = at; i < at + literalLength; i++) {
      output[aat++] = info->packet[i];
    }
    at += literalLength;
    if(at >= info->packet_len - 2) {
      break;
    }
    const size_t copyStart = aat - ((info->packet[at + 1] << 8) | info->packet[at]);
    at += 2;
    size_t copyLength = token & 0xf;
    if(copyLength == 0xf) {
      do {
        copyLength += info->packet[at];
      } while(info->packet[at++] == 0xff);
    }
    copyLength += 4;
    if(copyStart + copyLength <= aat) {
      for(size_t i = copyStart; i < copyStart + copyLength; i++) {
        output[aat++] = output[i];
      }
    } else {
      const size_t oldLength = aat;
      for(size_t i = copyStart; i < oldLength; i++) {
        output[aat++] = output[i];
      }
      for(size_t i = 0; i < copyStart + copyLength - oldLength; i++) {
        output[aat++] = output[oldLength + i];
      }
    }
  }
  tcp_send(info->socket, output - 5, total_size + 5, data_read_only);
  (void) pthread_detach(pthread_self());
  free(info->packet);
  free(in);
  return NULL;
}

#undef info

void onpacket(struct tcp_socket* socket) {
  pthread_t id;
  struct info* inf = malloc(sizeof(struct info));
  inf->socket = socket;
  inf->packet = packet;
  inf->packet_len = packet_len;
  if(packet[0] == 0) {
    puts("solving pow");
    pthread_create(&id, NULL, solve_pow, inf);
  } else {
    puts("decompressing");
    pthread_create(&id, NULL, decompress_packet, inf);
  }
}

int socket_onevent(struct tcp_socket* socket, enum tcp_event event) {
  switch(event) {
    case tcp_data: {
      uint8_t temp[4096];
      size_t read = 0;
      errno = 0;
      do {
        read = tcp_read(socket, temp, 4096);
        if(read != 0) {
          buffer = realloc(buffer, buffer_len + read);
          (void) memcpy(buffer + buffer_len, temp, read);
          buffer_len += read;
        }
      } while(read != 0 && errno == 0);
      while(buffer_len > 6 && *(uint32_t*)buffer <= buffer_len - 4) {
        packet_len = *(uint32_t*) buffer;
        packet = malloc(packet_len);
        (void) memcpy(packet, buffer + 4, packet_len);
        printf("packet len %lu\n", packet_len);
        onpacket(socket);
        buffer_len -= packet_len + 4;
        (void) memmove(buffer, buffer + packet_len + 4, buffer_len);
      }
      break;
    }
    case tcp_close: {
      tcp_socket_free(socket);
      break;
    }
    default: break;
  }
  return 0;
}

int server_onevent(struct tcp_server* server, enum tcp_event event, struct tcp_socket* socket, const struct sockaddr* addr) {
  switch(event) {
    case tcp_creation: {
      socket->on_event = socket_onevent;
      break;
    }
    case tcp_close: {
      tcp_server_free(server);
      break;
    }
    default: break;
  }
  return 0;
}

int onerror(int code) {
  return -1;
}

int main() {
  handle_error = onerror;
  srand(time_get_time());
  
  struct tcp_server_settings set = { 8, 4 };
  struct tcp_server server = {0};
  server.on_event = server_onevent;
  server.settings = &set;
  if(tcp_server(&server, &((struct tcp_server_options) {
    .hostname = "127.0.0.1",
    .port = "8120",
    .family = ipv4
  })) == -1) {
    printf("tcp_server() errno %d\n", errno);
    return -1;
  }
  
  net_epoll_stop(server.epoll);
  (void) net_epoll_thread(server.epoll);
  puts("should be unreachable!");
  return 0;
}