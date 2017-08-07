#!/usr/bin/env perl

use v5.12;
use strict;
use warnings;

use lib qw(./lib);

use JVC;
use JSON;
use Getopt::Long;
use AnyEvent::MQTT;

use Data::Dumper;

my $host;
my $name;
my ($mqtt_server, $mqtt_user, $mqtt_password);
my $min_remain = 60;

GetOptions("host|h=s" => \$host,
           "server|s=s" => \$mqtt_server,
           "user|u=s" => \$mqtt_user,
           "password|p=s" => \$mqtt_password,
	   "name|n=s" => \$name,
	   "min-remain" => \$min_remain
);

die "host needs to be given" unless $host;

my $mqtt = AnyEvent::MQTT->new(host => $mqtt_server, user_name => $mqtt_user, password => $mqtt_password);
my $jvc = JVC->new(host => $host);

sub format_status {
	my ($slot) = @_;

	my $ret;
	if ($slot->{Status} eq 'SelectRec') {
		$ret = 'rec';
	} elsif ($slot->{Status} eq 'NoSelect') {
		$ret = 'idle';
	} else {
		$ret = 'unknown';
	}

	return $ret . " " . $slot->{Remain} . " min";
}

my $timer = AnyEvent->timer(after => 0, interval => 1200, cb =>
	sub {
		my $r = $jvc->cmd("GetCamStatus");
		return unless $r;

		my $pretty_status = "A: " . format_status($r->{SlotA}) . " | B: " . format_status($r->{SlotB});
		my $remain = $r->{SlotA}{Remain} + $r->{SlotB}{Remain};

		say "$name -> $pretty_status";

		if ($r->{SlotA}{Status} ne 'SelectRec' and $r->{SlotB}{Status} ne 'SelectRec') {
			$mqtt->publish(topic => "/voc/alert", message => encode_json({
						component => "jvc/${name}",
						level => "error",
						msg => "No on-camera recording active"
					}));

		} elsif ($remain < $min_remain) {
			$mqtt->publish(topic => "/voc/alert", message => encode_json({
						component => "jvc/${name}",
						level => "error",
						msg => "Remaining recording time is below $min_remain minutes ($pretty_status)"
					}));
		}
	});

AnyEvent->condvar->recv;
