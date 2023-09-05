#include <stdio.h>
#include <assert.h>
#include <stdlib.h>
#include <pthread.h>

#include <libwebsockets.h>

#define ARRAYLEN(A) (sizeof(A)/sizeof((A)[0]))


typedef struct entity
{
	uint16_t id;
	uint16_t owner_id;

	uint8_t color;
	uint8_t sides;
	uint8_t level;
	uint8_t type;

	uint32_t score;

	float x;
	float y;

	float hp;
	float max_hp;

	float fov;
	float size;
}
entity_t;

static entity_t entities[65536];
// TODO maybe make another array but with clumped entities


typedef struct msg
{
	uint8_t* data;
	uint32_t len;
	uint32_t* ref;
}
msg_t;

typedef struct user
{
	pthread_mutex_t mutex;

	struct lws* ws;

	msg_t* msges;
	uint32_t msges_len;

	uint32_t next;

	uint8_t* in;
	uint32_t in_len;
}
user_t;

static user_t users[100];
static uint32_t free_user;
static pthread_mutex_t user_mutex;

static void
init_users(
	void
	)
{
	pthread_mutex_init(&user_mutex, NULL);

	user_t* user = users;
	user_t* user_end = user + ARRAYLEN(users);
	uint32_t i = 0;

	do
	{
		pthread_mutex_init(&user->mutex, NULL);
		user->next = ++i;
	}
	while(++user != user_end);
}

static user_t*
get_user(
	void
	)
{
	pthread_mutex_lock(&user_mutex);

	user_t* user = users + free_user;
	free_user = user->next;

	pthread_mutex_unlock(&user_mutex);

	return user;
}

static void
ret_user(
	user_t* user
	)
{
	pthread_mutex_lock(&user_mutex);

	user->next = free_user;
	free_user = user - users;

	pthread_mutex_unlock(&user_mutex);
}


static void
send_to_user_raw(
	user_t* user,
	uint8_t* data,
	uint32_t len,
	uint32_t* ref
	)
{
	if(user->ws == NULL)
	{
		return;
	}

	uint32_t new_msges_len = user->msges_len + 1;
	user->msges = realloc(user->msges, sizeof(*user->msges) * new_msges_len);
	assert(user->msges);

	user->msges[user->msges_len] =
	(msg_t)
	{
		.data = data,
		.len = len,
		.ref = ref
	};
	user->msges_len = new_msges_len;

	lws_callback_on_writable(user->ws);
}

static void
send_to_user(
	user_t* user,
	uint8_t* data,
	uint32_t len,
	uint32_t* ref
	)
{
	pthread_mutex_lock(&user->mutex);
	send_to_user_raw(user, data, len, ref);
	pthread_mutex_unlock(&user->mutex);
}


static void
onmsg(
	user_t* user,
	uint8_t* data,
	uint32_t len
	)
{
	printf("got %u bytes from user %lu\n", len, user - users);

	void* mem = malloc(len + LWS_PRE) + LWS_PRE;
	memcpy(mem, data, len);
	send_to_user_raw(user, mem, len, NULL);
}


static int
ws_callback(
	struct lws* ws,
	enum lws_callback_reasons reason,
	void* user_data,
	void* in,
	size_t len
	)
{
	switch(reason)
	{

	case LWS_CALLBACK_ESTABLISHED:
	case LWS_CALLBACK_SERVER_WRITEABLE:
	case LWS_CALLBACK_RECEIVE:
	case LWS_CALLBACK_CLOSED: break;
	default: return 0;

	}

	if(reason == LWS_CALLBACK_ESTABLISHED)
	{
		user_t* user = get_user();
		user->ws = ws;

		*(void**)user_data = user;

		printf("new user %lu\n", user - users);

		return 0;
	}

	user_t* user = *(void**)user_data;

	pthread_mutex_lock(&user->mutex);

	switch(reason)
	{

	case LWS_CALLBACK_SERVER_WRITEABLE:
	{
		msg_t* msg = user->msges;
		msg_t* msg_end = msg + user->msges_len;

		while(msg != msg_end)
		{
			lws_write(ws, msg->data, msg->len, LWS_WRITE_BINARY);

			if(!msg->ref || !--*msg->ref)
			{
				free(msg->data - LWS_PRE);
			}

			++msg;
		}

		free(user->msges);
		user->msges = NULL;
		user->msges_len = 0;

		break;
	}

	case LWS_CALLBACK_RECEIVE:
	{
		int first = lws_is_first_fragment(ws);
		int final = lws_is_final_fragment(ws);

		if(first && final)
		{
			onmsg(user, in, len);
		}
		else
		{
			uint32_t new_in_len = user->in_len + len;
			user->in = realloc(user->in, new_in_len);
			assert(user->in);

			memcpy(user->in + new_in_len, in, len);
			user->in_len = new_in_len;

			if(final)
			{
				onmsg(user, user->in, user->in_len);

				free(user->in);
				user->in = NULL;
				user->in_len = 0;
			}
		}

		break;
	}

	case LWS_CALLBACK_CLOSED:
	{
		// TODO deref entities held by this user
		printf("user %lu dced\n", user - users);

		free(user->in);
		user->in = NULL;
		user->in_len = 0;

		free(user->msges);
		user->msges = NULL;
		user->msges_len = 0;

		user->ws = NULL;

		ret_user(user);

		break;
	}

	default: __builtin_unreachable();

	}

	pthread_mutex_unlock(&user->mutex);

	return 0;
}


static void
run_lws(
	void
	)
{
	lws_set_log_level(0, NULL);

	struct lws_context_creation_info info = {0};

	info.port = 9348;
	info.protocols =
	(struct lws_protocols[])
	{
		{ "diep", ws_callback, sizeof(void*), 65536, 0, NULL, 0 },
		{ 0 }
	};
	info.pt_serv_buf_size = 65536;
	info.options = LWS_SERVER_OPTION_DISABLE_IPV6 |
		LWS_SERVER_OPTION_HTTP_HEADERS_SECURITY_BEST_PRACTICES_ENFORCE;

	const lws_retry_bo_t idle =
	(lws_retry_bo_t)
	{
		.secs_since_valid_ping = 1,
		.secs_since_valid_hangup = 10
	};
	info.retry_and_idle_policy = &idle;

	struct lws_context* context = lws_create_context(&info);
	assert(context);

	while(1)
	{
		lws_service(context, 0);
	}

	__builtin_unreachable();
}


int
main()
{
	init_users();

	run_lws();
}
